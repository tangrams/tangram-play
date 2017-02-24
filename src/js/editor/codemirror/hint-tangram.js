import CodeMirror from 'codemirror';
import { hint } from '../suggest';

CodeMirror.registerHelper('hint', 'yaml', hint);
