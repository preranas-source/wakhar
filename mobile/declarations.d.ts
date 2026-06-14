declare global {
  namespace JSX {
    interface Element extends import('react').JSX.Element {}
    interface ElementClass extends import('react').JSX.ElementClass {}
    interface IntrinsicElements extends import('react').JSX.IntrinsicElements {}
  }
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: any;
  export default content;
}

