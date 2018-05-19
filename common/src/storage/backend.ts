
export abstract class StorageBackend {

   public abstract async exists(key: string): Promise<boolean>;

   public abstract async bucketExists(): Promise<boolean>;

   public abstract async allMatching(dirPrefix: string, pattern: RegExp): Promise<string[]>;

   public abstract async readJson<T>(key: string): Promise<T>;

   public abstract async writeJson<T>(key: string, value: T): Promise<void>;

   public abstract async deleteJson(key: string): Promise<void>;

   public abstract async deletePrefix(dirPrefix: string): Promise<void>;

   public abstract rootDirectory(): string;

}
