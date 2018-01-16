import fs = require('fs');
import mustache = require('mustache');
import path = require('path');

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

// when true, the rendered html will be written to the log whenever a Template's getText() function is called
const PRINT_RENDERS: boolean = false;

const staticPath: string = path.resolve(__dirname, '../static');
logger.info(`Mustache Templating static path is ${staticPath}`);

export class Template {

   public readonly name: string;
   public view: object;
   private readonly mustacheFile: string;
   private partials: Template[];

   private mustacheFileText: string;

   private parsed: boolean;
   private topLevel: boolean;

   constructor(name: string, file: string, view: object = {}, partials: Template[] = [], topLevel: boolean = false) {

      this.name = name;
      this.view = view;
      this.mustacheFile = path.resolve(staticPath, file);
      this.parsed = false;
      this.partials = partials;
      this.topLevel = topLevel;

   }

   public getText(): string {

      // the first time, parse the template
      if (!this.parsed) {
         this.parseFile();
      }

      // get the partials
      let renderredPartials: any = null;
      if (this.partials.length) {
         renderredPartials = {};
         for (const partial of this.partials) {
            renderredPartials[partial.name] = partial.getText();
         }
      }

      // render it with the specific view
      const result: string = mustache.render(this.mustacheFileText, this.view, renderredPartials);

      if (PRINT_RENDERS && this.topLevel) {
         this.printResult(result);
      }

      return result;

   }

   private parseFile() {

      this.mustacheFileText = fs.readFileSync(this.mustacheFile).toString('utf8');
      mustache.parse(this.mustacheFileText);
      this.parsed = true;

   }

   private printResult(result: string): void {

      const head: string = `----------------==[ ${this.name} ]==----------------`;
      const foot: string = '';

      logger.info([head, result, foot].join('\n'));
   }

}

const baseHeader = new Template('base-header', 'html/pages/partials/base-header.mustache');
const baseNeck = new Template('base-neck', 'html/pages/partials/base-neck.mustache');
const baseFooter = new Template('base-footer', 'html/pages/partials/base-footer.mustache');
const basePartials = [baseHeader, baseNeck, baseFooter];

// pages
const index = new Template('index', 'html/pages/index.mustache', {}, basePartials, true);
const environments = new Template('environment', 'html/pages/environments.mustache', {}, basePartials, true);
const dashboard = new Template('environment', 'html/pages/dashboard.mustache', {}, basePartials, true);
const captures = new Template('captures', 'html/pages/captures.mustache', {}, basePartials, true);
const capture = new Template('capture', 'html/pages/capture.mustache', {}, basePartials, true);
const replay = new Template('replay', 'html/pages/replay.mustache', {}, basePartials, true);
const metrics = new Template('metrics', 'html/pages/metrics.mustache', {}, basePartials, true);

export const Pages = {
   capture,
   captures,
   dashboard,
   environments,
   index,
   metrics,
   replay,
};
