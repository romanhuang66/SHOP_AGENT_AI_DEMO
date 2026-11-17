import type {Knowledge,Message} from './business';
export type PromptVersion={id:string;text:string;created:string};
export type EvalCase={id:string;title:string;input:string;contains:string;tool:string;citation:boolean};
export type EvalResult={id:string;caseId:string;caseTitle:string;input:string;created:string;promptId:string;state:'running'|'done'|'error';answer?:Message;error?:string;autoPass?:boolean;human?:'pass'|'fail';note?:string};
export type Workspace={testConversations?:string[];knowledge:Knowledge[];prompts:PromptVersion[];activePrompt:string;cases:EvalCase[];results:EvalResult[];prices:{input:number|null;output:number|null;currency:string};audit:{time:string;action:string}[]};
