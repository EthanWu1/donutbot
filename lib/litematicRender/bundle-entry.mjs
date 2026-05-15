import * as deepslate from 'deepslate';
import * as render from 'deepslate/render';
import { mat4 } from 'gl-matrix';

window.DS = { ...deepslate, ...render, mat4 };
