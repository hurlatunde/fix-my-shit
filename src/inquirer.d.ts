declare module 'inquirer' {
  export function prompt<T>(questions: object | object[]): Promise<T>;
}
