import {managementHomeHref} from '../home-link.mjs';
import '../home-link.css';
import './styles.css';
import { industryDataset, industryMajorSelection as IndustryMajorSelection } from '../../../packages/industry-core/index.mjs';
import { safeIndustryReturnUrl, createIndustryReturnUrl } from './state.mjs';
import { createIndustryBrowserBridge } from '../../../packages/data-access/industry-browser.mjs';


    document.getElementById('managementHomeLink').href = managementHomeHref(location.href);
    const industryMajorChainData = industryDataset;
    if (!industryMajorChainData) throw new Error('产业链专业数据加载失败');
    const officialIndustryMajors = industryMajorChainData.majors;
    const industryResearchDemoKpisByChainId = {
      'chain-75155ff272': { jobCount: 128, enterpriseCount: 37626 }
    };
    const getIndustryResearchDemoKpis = (chainId) => {
      const configured = industryResearchDemoKpisByChainId[chainId];
      if (configured) return configured;
      const seed = Array.from(chainId).reduce(
        (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
        0
      );
      return {
        jobCount: 48 + (seed % 121),
        enterpriseCount: 1200 + (seed % 48000)
      };
    };
    let activeChains = [];
    const disabledJobIds = new Set();
    let jobNameMatchingEnabled = false;
    let jobMatchingLoading = false;
    let jobMatchingTimer;
    const cancelJobMatching = () => {
      clearTimeout(jobMatchingTimer);
      jobMatchingTimer = undefined;
      jobMatchingLoading = false;
    };
    const cmsAiCourseCreationStateKey = 'major-construction-platform:cms-ai-course-creation';
    const cmsEntryParam = new URLSearchParams(window.location.search).get('entry');
    const cmsProfessionalName = new URLSearchParams(window.location.search).get('majorName') || '智能建造工程专业';
    const cmsAiCourseRows = [
      [3182, '萧瑟专业建设520', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
      [3180, 'm空 专业建设', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
      [3165, 'm专业建设', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
      [3139, '萧瑟专业建设512', '是', '学堂自研 - DeepSeek-V3', '共建课程-专业建设', '黄河大学', '教学平台']
    ];
    const courseForm = { name: '', schoolId: '', schoolLabel: '', typeLevel1: '', typeLevel2: '', college: '' };
    const courseStaticErrors = {};
    document.querySelector('#cmsProfessionalName').textContent = cmsProfessionalName;
    const showCourseListPage = () => {
      document.querySelector('#courseListPage').hidden = false;
      document.querySelector('#industryPage').hidden = true;
      document.querySelector('#createCourseOverlay').hidden = true;
    };
    const showIndustryResearchPage = () => {
      document.querySelector('#courseListPage').hidden = true;
      document.querySelector('#industryPage').hidden = false;
      document.querySelector('#createCourseOverlay').hidden = true;
    };
    window.showIndustryResearchPage = showIndustryResearchPage;
    const renderCourseRows = () => {
      document.querySelector('#courseRows').innerHTML = cmsAiCourseRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}<td><button class="link-button">管理</button></td></tr>`).join('');
    };
    const setStaticCourseError = (field, message = '') => {
      courseStaticErrors[field] = message;
      const errorNode = document.querySelector(`#${field}Error`);
      if (!errorNode) return;
      errorNode.textContent = message;
      errorNode.hidden = message === '';
    };
    const scrollStaticCourseModalToError = () => {
      const firstErrorField = Object.entries(courseStaticErrors).find(([, message]) => message)?.[0];
      if (!firstErrorField) return;
      const target = document.querySelector(`#${firstErrorField}`) || document.querySelector(`#${firstErrorField}Error`);
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const resetStaticCourseForm = () => {
      Object.assign(courseForm, { name: '', schoolId: '', schoolLabel: '', typeLevel1: '', typeLevel2: '', college: '' });
      document.querySelector('#courseName').value = '';
      document.querySelector('#courseEnglishName').value = '';
      document.querySelector('#courseIntro').value = '';
      document.querySelector('#courseSchool').value = '';
      document.querySelector('#courseTypeLevel1').value = '';
      document.querySelector('#courseTypeLevel2').value = '';
      document.querySelector('#courseCollege').value = '';
      document.querySelector('#schoolExpandedFields').hidden = true;
      ['courseName', 'courseSchool', 'courseType', 'courseCollege'].forEach((field) => setStaticCourseError(field, ''));
    };
    const validateStaticCourseCreation = () => {
      courseForm.name = document.querySelector('#courseName').value.trim();
      courseForm.schoolId = document.querySelector('#courseSchool').value;
      courseForm.schoolLabel = document.querySelector('#courseSchool').selectedOptions[0]?.textContent || '';
      courseForm.typeLevel1 = document.querySelector('#courseTypeLevel1').value;
      courseForm.typeLevel2 = document.querySelector('#courseTypeLevel2').value;
      courseForm.college = document.querySelector('#courseCollege').value;
      document.querySelector('#schoolExpandedFields').hidden = courseForm.schoolId === '';
      setStaticCourseError('courseName', courseForm.name ? '' : '请输入名称');
      setStaticCourseError('courseSchool', courseForm.schoolId ? '' : '请选择所属学校');
      setStaticCourseError('courseType', courseForm.typeLevel1 === '学科共建' && courseForm.typeLevel2 === '专业建设' ? '' : '请选择学科共建 / 专业建设');
      setStaticCourseError('courseCollege', courseForm.college ? '' : '请选择所属学院');
      return !Object.values(courseStaticErrors).some(Boolean);
    };
    const getIndustryMajorProfile = (major) => {
      const relations = industryMajorChainData.relations
        .filter((relation) => relation.majorKey === major.key)
        .sort((first, second) => first.order - second.order);
      const chainLookup = new Map(industryMajorChainData.chains.map((chain) => [chain.id, chain]));
      return {
        major,
        chains: relations.map((relation) => ({
          ...relation,
          id: relation.chainId,
          name: chainLookup.get(relation.chainId)?.name || relation.chainId,
          ...getIndustryResearchDemoKpis(relation.chainId)
        }))
      };
    };
    const industryBrowserBridge = createIndustryBrowserBridge(window);
    const selected = new Set();
    let page = 1;
    const pageSize = 3;
    let initMajorLevel = 'undergraduate';
    let selectedInitMajorKeys = new Set();
    let confirmedInitMajors = [];
    const firstInitMajor = () => confirmedInitMajors[0] || null;
    const majorProfiles = () => confirmedInitMajors.map(major => ({ major, profile: getIndustryMajorProfile(major) }));
    const buildMultiMajorChains = () => IndustryMajorSelection.mergeChains(majorProfiles().map(({ major, profile }) => ({ major, chains: profile ? profile.chains : [] })));
    const escapeMajorText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    let initMajorPage = 1;
    const initMajorPageSize = 8;
    let chainKeyword = '';
    let industryResearchMajorMissing = false;
    let currentIndustryState = industryBrowserBridge.consume();
    const persistSelection = () => {
      const activeChainIds = new Set(activeChains.map((chain) => chain.id));
      [...selected].forEach((id) => {
        if (!activeChainIds.has(id)) selected.delete(id);
      });
      currentIndustryState = industryBrowserBridge.write({
        initialized: selected.size > 0 || (jobNameMatchingEnabled && !jobMatchingLoading && activeChains.length === 0 && !!firstInitMajor()),
        matchingMode: jobNameMatchingEnabled && activeChains.length === 0 ? 'job-name' : 'chain',
        disabledJobIds: [...disabledJobIds],
        matchedJobs: jobNameMatchingEnabled && !jobMatchingLoading ? IndustryMajorSelection.matchJobs(confirmedInitMajors) : [],
        selectedChainIds: [...selected],
        officialMajors: confirmedInitMajors.map(major => ({ level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name })),
        officialMajor: firstInitMajor() ? {
          level: firstInitMajor().uiLevel,
          sourceLevel: firstInitMajor().sourceLevel,
          code: firstInitMajor().code,
          name: firstInitMajor().name
        } : null,
        selectedAt: new Date().toISOString()
      });
    };
    const filteredInitMajors = () => {
      const keyword = document.querySelector('#initMajorSearch').value.trim().toLowerCase();
      return officialIndustryMajors.filter((major) =>
        major.uiLevel === initMajorLevel &&
        (!keyword || major.code.toLowerCase().includes(keyword) || major.name.toLowerCase().includes(keyword))
      );
    };
    const buildCompactPageTokens = (currentPage, totalPages) => {
      const visiblePages = new Set([1, totalPages]);
      for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
        if (page >= 1 && page <= totalPages) visiblePages.add(page);
      }
      return [...visiblePages].sort((left, right) => left - right).reduce((tokens, page, index, pages) => {
        if (index > 0 && page - pages[index - 1] > 1) tokens.push('ellipsis');
        tokens.push(page);
        return tokens;
      }, []);
    };
    const renderInitMajorOptions = () => {
      const majors = filteredInitMajors();
      const totalPages = Math.max(1, Math.ceil(majors.length / initMajorPageSize));
      initMajorPage = Math.min(Math.max(1, initMajorPage), totalPages);
      const start = (initMajorPage - 1) * initMajorPageSize;
      document.querySelector('#initMajorList').innerHTML = majors.slice(start, start + initMajorPageSize).map(major => `
        <label class="cms-industry-major-option ${selectedInitMajorKeys.has(major.key) ? 'selected' : ''}">
          <input type="checkbox" name="init-official-major" value="${major.key}" data-init-major-key="${major.key}" ${selectedInitMajorKeys.has(major.key) ? 'checked' : ''}>
          <span><strong>${major.code} ${major.name}</strong><em>${major.sourceLevel} · ${major.category} / ${major.majorCategory}</em><em>${major.matchStatus}</em></span>
        </label>`).join('');
      document.querySelector('#initMajorPagination').innerHTML = `<button ${initMajorPage === 1 ? 'disabled' : ''} data-init-major-page="${initMajorPage - 1}">上一页</button>` +
        buildCompactPageTokens(initMajorPage, totalPages).map(token => token === 'ellipsis'
          ? '<span class="cms-pagination-ellipsis" aria-hidden="true">…</span>'
          : `<button class="${initMajorPage === token ? 'active' : ''}" data-init-major-page="${token}">${token}</button>`).join('') +
        `<button ${initMajorPage === totalPages ? 'disabled' : ''} data-init-major-page="${initMajorPage + 1}">下一页</button>`;
      document.querySelector('#initMajorError').hidden = true;
      document.querySelector('#confirmInitMajorPicker').disabled = selectedInitMajorKeys.size === 0;
      document.querySelector('#confirmInitMajorPicker').textContent = `确认关联（${selectedInitMajorKeys.size}）`;
      const chosen = [...selectedInitMajorKeys].flatMap(key => officialIndustryMajors.find(major => major.key === key) || []);
      document.querySelector('#initMajorSelected').innerHTML = `<div class="cms-major-selected-heading"><strong>已选 ${chosen.length} 个专业</strong>${chosen.length ? '<button type="button" id="clearInitMajors">清空</button>' : ''}</div>` + (chosen.length ? `<div class="cms-major-selected-tags">${chosen.map(major => `<span>${escapeMajorText(major.name)} <small>${escapeMajorText(major.code)} · ${escapeMajorText(major.sourceLevel)}</small><button type="button" aria-label="移除${escapeMajorText(major.name)}（${escapeMajorText(major.sourceLevel)}）" data-remove-init-major="${escapeMajorText(major.key)}">×</button></span>`).join('')}</div>` : '<p>勾选下方专业，可跨分页和专业层次选择。</p>');
      if (!majors.length) document.querySelector('#initMajorList').innerHTML = '<p>未找到相关专业，请调整搜索条件。</p>';
    };
    const openInitMajorPicker = () => {
      selectedInitMajorKeys = new Set(confirmedInitMajors.map(major => major.key));
      if (firstInitMajor()) initMajorLevel = firstInitMajor().uiLevel;
      document.querySelector('#initMajorSearch').value = '';
      initMajorPage = 1;
      document.querySelectorAll('[data-init-major-level]').forEach(button => button.classList.toggle('active', button.dataset.initMajorLevel === initMajorLevel));
      document.querySelector('#initMajorPickerOverlay').hidden = false;
      renderInitMajorOptions();
    };
    const closeInitMajorPicker = () => {
      document.querySelector('#initMajorPickerOverlay').hidden = true;
    };
    const confirmInitMajorPicker = () => {
      const majors = [...selectedInitMajorKeys].flatMap(key => officialIndustryMajors.find(item => item.key === key) || []);
      if (!majors.length) {
        const errorNode = document.querySelector('#initMajorError');
        errorNode.textContent = '请至少选择一个教育部备案专业';
        errorNode.hidden = false;
        return;
      }
      const changed = majors.length !== confirmedInitMajors.length || majors.some(major => !confirmedInitMajors.some(item => item.key === major.key));
      if (!changed) { closeInitMajorPicker(); return; }
      jobNameMatchingEnabled = false; disabledJobIds.clear();
      confirmedInitMajors = majors;
      closeInitMajorPicker();
      init();
    };
    const filteredChains = () => {
      const keyword = chainKeyword.trim().toLowerCase();
      if (!keyword) return activeChains;
      return activeChains.filter((chain) =>
        [chain.name, chain.stage, chain.node, chain.confidence, chain.score, chain.evidence, chain.description]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      );
    };
    const renderAssociatedChains = () => {
      const associatedChains = activeChains.filter((chain) => selected.has(chain.id));
      document.querySelector('#associatedChainCount').textContent = `${associatedChains.length} 条`;
      document.querySelector('#associatedChainList').innerHTML = associatedChains.map((chain) => `<span>${chain.name}</span>`).join('');
      document.querySelector('#associatedChainList').hidden = associatedChains.length === 0;
      document.querySelector('#associatedChainEmpty').hidden = associatedChains.length > 0;
    };
    const render = () => {
      const visibleChains = filteredChains();
      const totalPages = Math.max(1, Math.ceil(visibleChains.length / pageSize));
      page = Math.min(Math.max(1, page), totalPages);
      const start = (page - 1) * pageSize;
      document.querySelector('#associatedMajorCount').textContent = confirmedInitMajors.length;
      document.querySelector('#associatedMajorResults').innerHTML = majorProfiles().map(({ major, profile }) => `<article class="cms-major-result-card"><div><span class="cms-major-level-tag">${escapeMajorText(major.sourceLevel)}</span><span class="cms-major-match-status ${profile?.chains.length ? 'matched' : ''}">${profile?.chains.length ? `匹配 ${profile.chains.length} 条产业链` : escapeMajorText(major.matchStatus)}</span></div><h4>${escapeMajorText(major.name)} <small>${escapeMajorText(major.code)}</small></h4><p>${escapeMajorText(major.category)} / ${escapeMajorText(major.majorCategory)}</p>${profile?.chains.length ? `<div class="cms-major-chain-tags">${profile.chains.map(chain => `<span>${escapeMajorText(chain.name)}</span>`).join('')}</div>` : ''}</article>`).join('');
      renderAssociatedChains();
      document.querySelector('#jobMatchingPanel').hidden = activeChains.length > 0 || !firstInitMajor();
      document.querySelector('#jobNameMatching').checked = jobNameMatchingEnabled;
      document.querySelector('#jobMatchLoading').hidden = !jobMatchingLoading;
      document.querySelector('#jobMatchingPanel').setAttribute('aria-busy', String(jobMatchingLoading));
      document.querySelector('#jobMatchResults').hidden = !jobNameMatchingEnabled || jobMatchingLoading;
      const jobs = jobNameMatchingEnabled && !jobMatchingLoading ? IndustryMajorSelection.matchJobs(confirmedInitMajors) : [];
      document.querySelector('#jobMatchSummary').textContent = `已匹配 ${jobs.length} 个相关岗位 · 岗位画像测算`;
      document.querySelector('#jobMatchList').replaceChildren(...jobs.map(job => { const row = document.createElement('tr'); [job.name, job.taskCount, job.abilityCount].forEach(value => { const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell); });
        const action = document.createElement('td');
        const label = document.createElement('label'); label.className = 'job-effectiveness-control';
        const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-label', job.name + '是否生效'); toggle.checked = !disabledJobIds.has(job.id);
        toggle.addEventListener('change', () => { if (toggle.checked) disabledJobIds.delete(job.id); else disabledJobIds.add(job.id); persistSelection(); render(); });
        const status = document.createElement('span'); status.textContent = toggle.checked ? '生效' : '不生效';
        label.append(toggle, status); action.append(label); row.append(action); return row; }));
      document.querySelector('#profileEmpty').hidden = activeChains.length > 0;
      document.querySelector('#profileEmptyTitle').textContent = industryResearchMajorMissing ? '专业数据不存在，请重新选择专业' : '暂无确定关联产业链';
      document.querySelector('#chainRecommendations').hidden = activeChains.length === 0;
      document.querySelector('#chainEmpty').hidden = visibleChains.length > 0;
      document.querySelector('#chainList').hidden = visibleChains.length === 0;
      document.querySelector('#chainList').innerHTML = visibleChains.slice(start, start + pageSize).map(chain => `
        <article class="chain-row ${selected.has(chain.id) ? 'selected' : ''}">
          <div><div class="chain-title"><h4>${chain.name}</h4><span>${escapeMajorText(chain.relationType || '')}</span></div><p class="cms-chain-major-origin">关联专业：${chain.matchedMajors.map(major => escapeMajorText(major.name)).join('、')}</p><p>产业环节：${escapeMajorText(chain.node)} · 包含岗位数：${chain.jobCount.toLocaleString('zh-CN')} · 包含企业数：${chain.enterpriseCount.toLocaleString('zh-CN')}</p></div>
          <button class="select" data-id="${chain.id}">${selected.has(chain.id) ? '取消选择' : '选择'}</button>
        </article>`).join('');
      document.querySelector('#selectedCount').textContent = `已选 ${selected.size} 条产业链`;
      document.querySelector('#pagination').innerHTML = `<button ${page === 1 ? 'disabled' : ''} data-chain-page="${page - 1}">上一页</button>` +
        Array.from({ length: totalPages }, (_, index) => index + 1).map(num => `<button class="${page === num ? 'active' : ''}" data-chain-page="${num}">${num}</button>`).join('') +
        `<button ${page === totalPages ? 'disabled' : ''} data-chain-page="${page + 1}">下一页</button>`;
    };
    const init = () => {
      cancelJobMatching();
      const profiles = majorProfiles();
      activeChains = buildMultiMajorChains();
      if (activeChains.length) jobNameMatchingEnabled = false;
      selected.clear();
      activeChains.map((chain) => chain.id).forEach((id) => selected.add(id));
      industryResearchMajorMissing = profiles.length === 0;
      chainKeyword = '';
      page = 1;
      persistSelection();
      document.querySelector('#empty').style.display = 'none';
      document.querySelector('#chains').style.display = 'none';
      document.querySelector('#progress').style.display = 'grid';
      document.querySelector('#progressTitle').textContent = `正在为 ${confirmedInitMajors.length} 个关联专业匹配产业链数据`;
      setTimeout(() => { document.querySelector('#progress').style.display = 'none'; document.querySelector('#chains').style.display = 'block'; render(); }, 700);
    };
    document.querySelector('#jobNameMatching').addEventListener('change', event => {
      cancelJobMatching();
      jobNameMatchingEnabled = event.target.checked && activeChains.length === 0 && !!firstInitMajor();
      jobMatchingLoading = jobNameMatchingEnabled;
      persistSelection(); render();
      if (jobNameMatchingEnabled) {
        jobMatchingTimer = setTimeout(() => {
          jobMatchingTimer = undefined;
          jobMatchingLoading = false;
          persistSelection(); render();
        }, 1000);
      }
    });
    try {
      const saved = currentIndustryState;
      const majors = IndustryMajorSelection.restore(officialIndustryMajors, saved);
      if (majors.length) {
        confirmedInitMajors = majors;
        activeChains = buildMultiMajorChains();
        jobNameMatchingEnabled = saved.matchingMode === 'job-name' && activeChains.length === 0;
        (Array.isArray(saved.disabledJobIds) ? saved.disabledJobIds : []).forEach(id => disabledJobIds.add(id));
        (saved.selectedChainIds || []).forEach(id => { if (activeChains.some(chain => chain.id === id)) selected.add(id); });
        document.querySelector('#empty').style.display = 'none';
        document.querySelector('#chains').style.display = 'block';
        render();
      }
    } catch { /* Ignore invalid stored state. */ }
    renderCourseRows();
    if (cmsEntryParam === 'industry') showIndustryResearchPage();
    document.querySelector('#backToCourseList').addEventListener('click', showCourseListPage);
    document.querySelector('#openCreateCourse').addEventListener('click', () => {
      resetStaticCourseForm();
      document.querySelector('#createCourseOverlay').hidden = false;
    });
    document.querySelector('#closeCreateCourse').addEventListener('click', () => {
      document.querySelector('#createCourseOverlay').hidden = true;
    });
    document.querySelector('#cancelCreateCourse').addEventListener('click', () => {
      document.querySelector('#createCourseOverlay').hidden = true;
    });
    document.addEventListener('change', (event) => {
      if (event.target.id === 'courseSchool') {
        courseForm.schoolId = event.target.value;
        courseForm.schoolLabel = event.target.selectedOptions[0]?.textContent || '';
        document.querySelector('#schoolExpandedFields').hidden = courseForm.schoolId === '';
      }
      if (event.target.id === 'courseTypeLevel1') courseForm.typeLevel1 = event.target.value;
      if (event.target.id === 'courseTypeLevel2') courseForm.typeLevel2 = event.target.value;
      if (event.target.id === 'courseCollege') courseForm.college = event.target.value;
      setStaticCourseError(event.target.id.replace(/Level1|Level2/, ''), '');
    });
    // 专业管理初始化预留：后续进入专业管理时先让用户选择专业，再 loading 出产业链推荐，最后让用户选择产业链。
    document.querySelector('#confirmCreateCourse').addEventListener('click', () => {
      if (!validateStaticCourseCreation()) {
        scrollStaticCourseModalToError();
        return;
      }
      try { localStorage.setItem(cmsAiCourseCreationStateKey, JSON.stringify({ ...courseForm, createdAt: new Date().toISOString() })); } catch { /* The form remains usable when browser storage is unavailable. */ }
      document.querySelector('#createCourseOverlay').hidden = true;
      showIndustryResearchPage();
    });
    document.querySelector('#topInit').addEventListener('click', openInitMajorPicker);
    document.querySelector('#closeInitMajorPicker').addEventListener('click', closeInitMajorPicker);
    document.querySelector('#cancelInitMajorPicker').addEventListener('click', closeInitMajorPicker);
    document.querySelector('#confirmInitMajorPicker').addEventListener('click', confirmInitMajorPicker);
    document.querySelector('#initMajorList').addEventListener('change', event => {
      const key = event.target.dataset.initMajorKey;
      if (!key) return;
      event.target.checked ? selectedInitMajorKeys.add(key) : selectedInitMajorKeys.delete(key);
      renderInitMajorOptions();
    });
    document.querySelector('#initMajorPickerOverlay').addEventListener('keydown', event => { if (event.key === 'Escape') closeInitMajorPicker(); });
    document.querySelector('#initMajorSearch').addEventListener('input', () => {
      initMajorPage = 1;
      renderInitMajorOptions();
    });
    document.addEventListener('click', event => {
      if (event.target.matches('.select')) { const id = event.target.dataset.id; selected.has(id) ? selected.delete(id) : selected.add(id); persistSelection(); render(); }
      if (event.target.dataset.chainPage) {
        const totalPages = Math.max(1, Math.ceil(filteredChains().length / pageSize));
        page = Math.max(1, Math.min(totalPages, Number(event.target.dataset.chainPage)));
        render();
      }
      if (event.target.dataset.initMajorLevel) {
        initMajorLevel = event.target.dataset.initMajorLevel;
        initMajorPage = 1;
        document.querySelector('#initMajorSearch').value = '';
        document.querySelectorAll('[data-init-major-level]').forEach(button => button.classList.toggle('active', button === event.target));
        renderInitMajorOptions();
      }
      if (event.target.dataset.initMajorPage) { initMajorPage = Number(event.target.dataset.initMajorPage); renderInitMajorOptions(); }
      if (event.target.id === 'clearInitMajors') { selectedInitMajorKeys.clear(); renderInitMajorOptions(); }
      if (event.target.dataset.removeInitMajor) { selectedInitMajorKeys.delete(event.target.dataset.removeInitMajor); renderInitMajorOptions(); }
    });

    const returnTo = safeIndustryReturnUrl(new URLSearchParams(window.location.search).get('returnTo'), window.location.href);
    const returnButton = document.querySelector('#returnToPlatform');
    returnButton.hidden = !returnTo;
    returnButton.addEventListener('click', () => {
      const url = createIndustryReturnUrl(returnTo, currentIndustryState, window.location.href);
      if (url) window.location.assign(url);
    });
