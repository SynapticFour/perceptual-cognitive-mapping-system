import { loadQuestionsFromDiskImpl } from '../data/question-loader-fs';
import { setQuestionBank } from '../data/question-bank-state';

process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE = process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE ?? 'routing_coverage';
process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE = process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE ?? '0';

const questions = await loadQuestionsFromDiskImpl('en');
setQuestionBank(questions);
