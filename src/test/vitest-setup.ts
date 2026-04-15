import { loadQuestionsFromDiskImpl } from '../data/question-loader-fs';
import { setQuestionBank } from '../data/question-bank-state';

const questions = await loadQuestionsFromDiskImpl('en');
setQuestionBank(questions);
