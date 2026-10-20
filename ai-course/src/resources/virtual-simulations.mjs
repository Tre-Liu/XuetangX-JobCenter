import {virtualSimulationCovers} from '../media/virtual-simulation-covers.mjs';

// Fictional enterprise names and illustrative counts, without a live resource provider.
export const courseVirtualSimulations = [
 {id:'plc-sim-motor',providerName:'启衡自动化',name:'三相异步电动机正反转控制虚拟仿真实验',kind:'电机控制',learners:2386,theme:'motor'},
 {id:'plc-sim-ladder',providerName:'智研电气',name:'PLC基本指令与梯形图编程虚拟仿真实验',kind:'PLC编程',learners:1824,theme:'ladder'},
 {id:'plc-sim-conveyor',providerName:'联程智控',name:'输送线启停与电机互锁控制虚拟仿真实验',kind:'系统调试',learners:1568,theme:'conveyor'},
 {id:'plc-sim-star-delta',providerName:'华实机电',name:'电动机星三角降压启动虚拟仿真实验',kind:'电机控制',learners:1206,theme:'star-delta'},
 {id:'plc-sim-sorting',providerName:'科岳智造',name:'工件检测与自动分拣虚拟仿真实验',kind:'系统调试',learners:2150,theme:'sorting'},
 {id:'plc-sim-io',providerName:'铭拓工业',name:'PLC I/O点位接线与故障排查虚拟仿真实验',kind:'PLC编程',learners:986,theme:'io'},
].map(({theme,...item})=>({...item,cover:virtualSimulationCovers[theme],courseName:'电气控制与PLC',integration:'third-party',provenance:'电气控制与PLC虚仿资源本地展示配置（2026-10-10）；企业名称为虚构，封面由AI生成，学习人数为模拟数据，未连接企业平台'}));
