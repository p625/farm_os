export interface IInitializable {
  initialize(): void | Promise<void>
}

export interface IUpdatable {
  update(deltaTime: number): void
}

export interface IDisposable {
  dispose(): void
}

export interface IGameSystem extends IInitializable, IUpdatable, IDisposable {
  readonly name: string
}
