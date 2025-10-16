/**
 * Reusable Interceptor Factory
 *
 * This module provides a robust, future-proof pattern for intercepting Zotero functions.
 * Using rest parameters (...args) ensures our interceptors work even when Zotero
 * changes function signatures by adding or removing parameters.
 *
 * ## Why This Pattern?
 *
 * BAD (Fragile):
 * ```typescript
 * function wrapper(item, legacy, skipChildren) {
 *   return original(item, legacy, skipChildren);
 * }
 * ```
 * ❌ Breaks when Zotero adds a 4th parameter
 * ❌ Breaks when parameter names change
 *
 * GOOD (Future-proof):
 * ```typescript
 * function wrapper(firstParam, ...restParams) {
 *   return original(firstParam, ...restParams);
 * }
 * ```
 * ✅ Automatically adapts to signature changes
 * ✅ No gatekeeping needed
 *
 * ## Usage Example
 *
 * ```typescript
 * const interceptor = createInterceptor({
 *   targetPath: 'Zotero.Utilities.Item.itemToCSLJSON',
 *   beforeCall: (item, ...args) => {
 *     console.log('Before:', item);
 *   },
 *   afterCall: (result, item, ...args) => {
 *     console.log('After:', result);
 *     return result; // Can modify result here
 *   },
 *   wrapperMarker: '_myIntercepted',
 * });
 *
 * interceptor.install();
 * // ... later ...
 * interceptor.remove();
 * ```
 */

/**
 * Configuration for creating an interceptor
 */
export interface InterceptorConfig<T extends (...args: any[]) => any> {
  /**
   * Dot-notation path to the function to intercept
   * Examples:
   * - 'Zotero.Utilities.Item.itemToCSLJSON'
   * - 'Zotero.Utilities.Internal.itemToExportFormat'
   */
  targetPath: string;

  /**
   * Optional callback executed before calling original function
   * Receives all arguments that were passed to the wrapper
   * Can be used for logging, validation, or side effects
   */
  beforeCall?: (...args: Parameters<T>) => void;

  /**
   * Optional callback executed after calling original function
   * Receives the result and all original arguments
   * MUST return the result (possibly modified)
   *
   * This is where you modify the output before returning it to the caller
   */
  afterCall?: (result: ReturnType<T>, ...args: Parameters<T>) => ReturnType<T>;

  /**
   * Marker property name to detect if already wrapped
   * Prevents wrapper stacking during auto-reload
   * Default: '_intercepted'
   */
  wrapperMarker?: string;

  /**
   * Optional additional paths to intercept (for multi-path functions)
   * Example: For itemToCSLJSON, also intercept prototype version
   */
  additionalPaths?: string[];

  /**
   * Logging prefix for debug messages
   * Default: '[Interceptor]'
   */
  logPrefix?: string;
}

/**
 * Interceptor instance that can be installed and removed
 */
export interface Interceptor {
  install(): boolean;
  remove(): boolean;
  isInstalled(): boolean;
}

/**
 * Creates a future-proof function interceptor
 *
 * This factory handles all the boilerplate for intercepting Zotero functions:
 * - Stores original function reference
 * - Creates wrapper with rest parameters (...args)
 * - Prevents wrapper stacking
 * - Provides install/remove methods
 * - Supports multi-path interception (e.g., prototype methods)
 *
 * @param config - Interceptor configuration
 * @returns Interceptor instance with install/remove methods
 */
export function createInterceptor<T extends (...args: any[]) => any>(
  config: InterceptorConfig<T>,
): Interceptor {
  const {
    targetPath,
    beforeCall,
    afterCall,
    wrapperMarker = '_intercepted',
    additionalPaths = [],
    logPrefix = '[Interceptor]',
  } = config;

  let originalFunction: T | null = null;
  let isInstalled = false;

  /**
   * Gets the target object and property name from a dot path
   * Example: 'Zotero.Utilities.Item.itemToCSLJSON' =>
   *   { obj: Zotero.Utilities.Item, prop: 'itemToCSLJSON' }
   */
  function resolvePath(path: string): { obj: any; prop: string } | null {
    const parts = path.split('.');
    const prop = parts.pop()!;
    let obj: any = globalThis;

    for (const part of parts) {
      obj = obj?.[part];
      if (!obj) {
        ztoolkit.log(`${logPrefix} Cannot resolve path: ${path}`, 'warning');
        return null;
      }
    }

    return { obj, prop };
  }

  /**
   * Install the interceptor
   */
  function install(): boolean {
    if (isInstalled) {
      ztoolkit.log(`${logPrefix} Already installed for ${targetPath}`);
      return false;
    }

    const target = resolvePath(targetPath);
    if (!target) {
      return false;
    }

    const currentFunction = target.obj[target.prop];

    // Check if already wrapped (prevents stacking during auto-reload)
    if ((currentFunction as any)?.[wrapperMarker]) {
      ztoolkit.log(
        `${logPrefix} WARNING: ${targetPath} already wrapped, skipping`,
        'warning',
      );
      isInstalled = true; // Mark as installed to prevent further attempts
      return false;
    }

    // Store original function
    originalFunction = currentFunction;

    // Create future-proof wrapper using rest parameters
    const wrapper = function (this: any, firstParam: any, ...restParams: any[]) {
      // Execute before callback if provided
      if (beforeCall) {
        try {
          (beforeCall as any)(firstParam, ...restParams);
        } catch (e) {
          ztoolkit.log(`${logPrefix} beforeCall error: ${e}`, 'error');
        }
      }

      // Call original function with ALL arguments unchanged
      const result = originalFunction!.call(this, firstParam, ...restParams);

      // Execute after callback if provided
      if (afterCall) {
        try {
          return (afterCall as any)(result, firstParam, ...restParams);
        } catch (e) {
          ztoolkit.log(`${logPrefix} afterCall error: ${e}`, 'error');
          return result; // Return unchanged on error
        }
      }

      return result;
    };

    // Mark wrapper to detect stacking
    (wrapper as any)[wrapperMarker] = true;

    // Install on primary path
    target.obj[target.prop] = wrapper;
    ztoolkit.log(`${logPrefix} Installed on ${targetPath}`);

    // Install on additional paths (e.g., prototype methods)
    for (const additionalPath of additionalPaths) {
      const additionalTarget = resolvePath(additionalPath);
      if (additionalTarget) {
        additionalTarget.obj[additionalTarget.prop] = wrapper;
        ztoolkit.log(`${logPrefix} Installed on ${additionalPath}`);
      }
    }

    isInstalled = true;
    return true;
  }

  /**
   * Remove the interceptor and restore original function
   */
  function remove(): boolean {
    if (!isInstalled || !originalFunction) {
      ztoolkit.log(`${logPrefix} Not installed, nothing to remove`);
      return false;
    }

    const target = resolvePath(targetPath);
    if (!target) {
      return false;
    }

    // Restore primary path
    target.obj[target.prop] = originalFunction;
    ztoolkit.log(`${logPrefix} Removed from ${targetPath}`);

    // Restore additional paths
    for (const additionalPath of additionalPaths) {
      const additionalTarget = resolvePath(additionalPath);
      if (additionalTarget) {
        additionalTarget.obj[additionalTarget.prop] = originalFunction;
        ztoolkit.log(`${logPrefix} Removed from ${additionalPath}`);
      }
    }

    isInstalled = false;
    originalFunction = null;
    return true;
  }

  return {
    install,
    remove,
    isInstalled: () => isInstalled,
  };
}
