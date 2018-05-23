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

      if (value === null || value === undefined) {
          throw Error(`Please provide a value for ${option.name}`);
      }

      // boolean flags
      if (option.type === Boolean) {
         return value ? [key] : [];
      }

      // arrays
      if (option.multiple && Array.isArray(value)) {
         return value.reduce((prev: string[], val) => prev.concat([key, val.toString()]), []);
      }

      // all other options
      return [key, value.toString()];
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
