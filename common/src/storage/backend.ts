
export abstract class StorageBackend {

   public abstract async readJson<T>(key: string): Promise<T>;

   public abstract async writeJson<T>(key: string, value: T): Promise<void>;

}
