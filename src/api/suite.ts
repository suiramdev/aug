import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import { Page } from 'playwright';

export type ItFnArgs = {
  page: Page;
};

export type ItFn = (args: ItFnArgs) => Promise<void>;

export interface It {
  id: string;
  parentId?: string;
  type: 'it';
  name: string;
  fn: ItFn;
}

export type DescribeFn = () => Promise<void>;

export interface Describe {
  id: string;
  parentId?: string;
  type: 'describe';
  name: string;
  fn: DescribeFn;
}

export interface Screenshot {
  id: string;
  parentId?: string;
  type: 'screenshot';
  name: string;
}

export type Suite = It | Describe | Screenshot;

export type TreeNode = Suite & {
  children: TreeNode[];
};

export interface SuiteContext {
  parentId?: string;
}

export const suiteContext = new AsyncLocalStorage<SuiteContext>();

export class SuiteRunner {
  suites: Suite[] = [];

  constructor() {}

  async registerIt(name: string, fn: ItFn) {
    const context = suiteContext.getStore();

    this.suites.push({
      id: crypto.randomUUID(),
      parentId: context?.parentId,
      type: 'it',
      name,
      fn,
    });
  }

  async registerDescribe(name: string, fn: DescribeFn) {
    const context = suiteContext.getStore();

    this.suites.push({
      id: crypto.randomUUID(),
      parentId: context?.parentId,
      type: 'describe',
      name,
      fn,
    });
  }

  async registerScreenshot(value: string) {
    const context = suiteContext.getStore();

    this.suites.push({
      id: crypto.randomUUID(),
      parentId: context?.parentId,
      type: 'screenshot',
      name: value,
    });
  }

  buildTree(): TreeNode[] {
    const nodes = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    this.suites.forEach((suite) => {
      nodes.set(suite.id, { ...suite, children: [] });
    });

    // Second pass: establish parent-child relationships
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // Optional: Helper method to print the tree
  static printTree(tree: TreeNode[]) {
    const print = (node: TreeNode, depth = 0) => {
      const indent = '  '.repeat(depth);
      console.log(`${indent}${node.type}: ${node.name}`);
      node.children.forEach((child) => print(child, depth + 1));
    };

    tree.forEach((root) => print(root));
  }
}
