import { OptionDefinition } from 'command-line-args';

export abstract class Config {

   public static makeOptionArgs(option: OptionDefinition, value: any): string[] {
      let key: string;
      if (option.name) {
         key = `--${option.name}`;
      } else if (option.alias) {
         key = `-${option.alias}`;
      } else {
         throw new Error("Cannot make option arguments without a name or alias");
      }

      if (option.type !== Boolean) {
         return [key, value.toString()];
      } else if (value) {
         return [key];
      } else {
         return [];
      }
   }

   public toArgList(): string[] {
      const options = this.getOptionsMap();

      let result: string[] = [];
      for (const pair of options) {
         result = result.concat(Config.makeOptionArgs.apply(Config, pair));
      }

      return result;
   }

   public toString(): string {
      return this.toArgList().join(' ');
   }

   protected abstract getOptionsMap(): Array<[OptionDefinition, any]>;

}
