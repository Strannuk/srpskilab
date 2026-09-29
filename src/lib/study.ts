import source from '../content/study-program-v3.json';
export type StudyTurn={by:string,sr:string,ru:string};
export type StudyExercise={id:string,kind:string,prompt:string,answer:string,explanation:string,options:string[]};
export interface StudyUnit{
 id:string;order:number;moduleId:number;level:string;title:string;canDo:string;
 studyEdition:string;editorialStatus:string;priorLessonId:string|null;priorTopic:string|null;
 situation:string;sourceExplanation:string;
 secondaryExplanation:{title:string,text:string,tip:string}[]|null;
 optionalAddon:{title:string,text:string}|null;
 successCriteria:string[];
 words:{sr:string,ru:string,role:string,id:string,usage?:string,usageRu?:string,cyr?:string}[];
 examples:{sr:string,ru:string}[];
 dialogue:{scenario:string,turns:StudyTurn[]};
 listening:{sr:string,ru:string,question:string,audioId:string,source:string};
 guided:StudyExercise[];
 oralPrompt:string;writingPrompt:string;rubric:string[];homework:string[];
 legacyExamNotice:string;validatedByHuman:boolean;
}
export const studyProgram=source as unknown as StudyUnit[];
export const studyById=new Map(studyProgram.map(unit=>[unit.id,unit]));
