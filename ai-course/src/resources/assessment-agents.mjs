// Course-scoped teaching fixtures, not connected to a live assessment service.
export const courseAssessmentAgents = [
 {id:'plc-agent-circuit',name:'电路图识别',kind:'图纸识别',description:'识别按钮、接触器、热继电器与电机，检查主回路、控制回路及自锁关系。'},
 {id:'plc-agent-ladder',name:'PLC梯形图检查',kind:'程序检查',description:'检查启停、自锁与互锁逻辑，核查定时器、计数器和复位条件。'},
 {id:'plc-agent-io',name:'I/O点位核对',kind:'接线核查',description:'对照点位表核对传感器、按钮、执行器与PLC地址，检查漏接和地址重复。'},
 {id:'plc-agent-interlock',name:'电机互锁诊断',kind:'故障诊断',description:'分析正反转回路的电气与程序互锁，定位同时导通及保护缺失问题。'},
 {id:'plc-agent-conveyor',name:'输送线联调评测',kind:'调试评测',description:'检查工件检测、输送启停、堵料报警与故障复位流程，核对验收记录。'},
].map(agent=>({...agent,courseName:'电气控制与PLC',provenance:'电气控制与PLC课程教学模拟配置（2026-10-10）'}));
