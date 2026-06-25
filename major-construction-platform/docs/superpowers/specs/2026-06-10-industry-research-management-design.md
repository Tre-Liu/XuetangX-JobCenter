# Industry Research Management Design

## Goal

Add a standalone management page for opening and configuring industry research for a major construction project. The page appears as a top-level tab named `产业调研` in the current professional construction management context.

## Scope

- Add `产业调研` to the top tab area used by the current professional construction management interface.
- Provide a `数据初始化` button as the first visible action.
- After the user clicks initialization, show a short `初始化中` progress state.
- When initialization completes, show recommended industry chains in a list.
- Place a `自主添加产业链` entry above the list.
- Allow the user to select one recommended industry chain and see a selected state.

## Interaction States

1. `idle`: The user has not initialized data. The page presents a primary initialization button and a short explanation.
2. `initializing`: The page shows progress copy and a visual progress indicator.
3. `ready`: The page shows the recommended industry chain list and the manual add entry.
4. `selected`: A recommended industry chain has been selected. The selected row is visually marked and a follow-up area confirms the choice.

## Data

Use local mock data for the demo. Recommended industry chains should be professional and relevant to 智能建造工程:

- 智能建造产业链
- 建筑工业化产业链
- 智慧城市基础设施产业链

Each item needs a name, stage summary, recommendation reason, evidence tags, and a match score.

## UI Approach

The page should feel like an operational management screen, not a marketing page. Use dense but readable information, restrained colors, compact cards, clear state badges, and predictable buttons. Avoid a separate landing page.

## Testing

Add a Node test that verifies:

- The `产业调研` top tab exists.
- The initialization state and progress copy exist.
- The recommended industry chain list is backed by mock data.
- The manual add entry appears above the list.
- Selecting a chain has a dedicated selected state.

