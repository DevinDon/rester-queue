type Name = string;

export function hello(name: Name): string {
  return `Hello, ${name}!`;
}

export async function asyncHello(name: Name): Promise<string> {
  return `Hello, ${name}!`;
}

process.stdout.write(hello('world'));
