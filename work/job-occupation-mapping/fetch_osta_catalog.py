import concurrent.futures
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path


TREE_PATH = Path("/tmp/osta_tree.json")
OUTPUT_PATH = Path("work/job-occupation-mapping/osta_occupation_catalog.json")
BASE_URL = "https://www.osta.org.cn/api/client/subordinate/data"


def leaf_groups(nodes):
    groups = []
    for node in nodes:
        children = node.get("children") or []
        if children:
            groups.extend(leaf_groups(children))
        elif node.get("careerCode") and node.get("versionId"):
            groups.append(
                {
                    "careerCode": node["careerCode"],
                    "careerName": node.get("careerName", ""),
                    "versionId": node["versionId"],
                }
            )
    return groups


def fetch_group(group):
    query = urllib.parse.urlencode(
        {"careerCode": group["careerCode"], "versionId": group["versionId"]}
    )
    url = f"{BASE_URL}?{query}"
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    last_error = None
    for attempt in range(4):
        try:
            with opener.open(request, timeout=30) as response:
                payload = json.load(response)
            if payload.get("code") != 200:
                raise RuntimeError(f"unexpected response: {payload}")
            return group, payload.get("body") or []
        except Exception as exc:
            last_error = exc
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"failed {group['careerCode']}: {last_error}")


def main():
    tree_payload = json.loads(TREE_PATH.read_text(encoding="utf-8"))
    groups = leaf_groups(tree_payload["body"])
    records = []
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(fetch_group, group): group for group in groups}
        for future in concurrent.futures.as_completed(futures):
            group = futures[future]
            try:
                fetched_group, items = future.result()
                for item in items:
                    records.append(
                        {
                            "careerCode": item.get("careerCode"),
                            "name": item.get("name"),
                            "versionId": item.get("versionId"),
                            "smallCode": fetched_group["careerCode"],
                            "smallName": fetched_group["careerName"],
                        }
                    )
            except Exception as exc:
                errors.append({"group": group, "error": str(exc)})

    records.sort(key=lambda item: item["careerCode"] or "")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "source": "https://www.osta.org.cn/career",
                "taxonomyVersion": 2,
                "groupCount": len(groups),
                "occupationCount": len(records),
                "errors": errors,
                "records": records,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "groupCount": len(groups),
                "occupationCount": len(records),
                "errorCount": len(errors),
                "output": str(OUTPUT_PATH),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
