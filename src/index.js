/*
 * Copyright (c) 2021 Anton Bagdatyev (Tonix)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Cartesian composition.
 */

import {
  setNestedPropertyValue,
  hasNestedPropertyValue,
  compose,
  isArray,
  yieldUniqueProgressiveIncrementalCombinations,
  areArrayItemsAllCoercibleToNumber,
} from "js-utl";

/**
 * Cartesian composition of functions (cross composition/cartesian decorator).
 *
 * @param {...Array.<number[]|Function|Array.<number[]|Function>>} args Each argument has to be an array where each element is:
 *
 *                                                                          - A function to compose prepended with an optional padding array (explained below);
 *                                                                          - An array of functions to compose prepended with an optional padding array (explained below);
 *
 *                                                                      E.g.:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [a, b, c], // A
 *                                                                            [d, e, f, g], // B
 *                                                                            [h, i] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      Will return the following cartesian composition:
 *
 *                                                                          // `ret` will be the result of the cartesian composition
 *                                                                          // (`A x B x C = [a, b, c] x [d, e, f, g] x [h, i]`):
 *                                                                          [
 *                                                                              // a
 *                                                                              a(d(h(1, 2, 3))),
 *                                                                              a(d(i(1, 2, 3))),
 *
 *                                                                              a(e(h(1, 2, 3))),
 *                                                                              a(e(i(1, 2, 3))),
 *
 *                                                                              a(f(h(1, 2, 3))),
 *                                                                              a(f(i(1, 2, 3))),
 *
 *                                                                              a(g(h(1, 2, 3))),
 *                                                                              a(g(i(1, 2, 3))),
 *
 *                                                                              // b
 *                                                                              b(d(h(1, 2, 3))),
 *                                                                              b(d(i(1, 2, 3))),
 *
 *                                                                              b(e(h(1, 2, 3))),
 *                                                                              b(e(i(1, 2, 3))),
 *
 *                                                                              b(f(h(1, 2, 3))),
 *                                                                              b(f(i(1, 2, 3))),
 *
 *                                                                              b(g(h(1, 2, 3))),
 *                                                                              b(g(i(1, 2, 3))),
 *
 *                                                                              // c
 *                                                                              c(d(h(1, 2, 3))),
 *                                                                              c(d(i(1, 2, 3))),
 *
 *                                                                              c(e(h(1, 2, 3))),
 *                                                                              c(e(i(1, 2, 3))),
 *
 *                                                                              c(f(h(1, 2, 3))),
 *                                                                              c(f(i(1, 2, 3))),
 *
 *                                                                              c(g(h(1, 2, 3))),
 *                                                                              c(g(i(1, 2, 3)))
 *                                                                          ]
 *
 *                                                                      This:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [a, b, c], // A
 *                                                                            [d, e, f, g], // B
 *                                                                            [h, i] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      Is effectively the same as writing this:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [[a], [b], [c]], // A
 *                                                                            [[d], [e], [f], [g]], // B
 *                                                                            [[h], [i]] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      But this:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [[a, z], [b], [c]], // A, notice [a, z]
 *                                                                            [[d], [e], [f], [g]], // B
 *                                                                            [[h], [i]] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      Will return to the following cartesian composition:
 *
 *                                                                          [
 *                                                                              // a
 *                                                                              a(z(d(h(1, 2, 3)))),
 *                                                                              a(z(d(i(1, 2, 3)))),
 *
 *                                                                              a(z(e(h(1, 2, 3)))),
 *                                                                              a(z(e(i(1, 2, 3)))),
 *
 *                                                                              a(z(f(h(1, 2, 3)))),
 *                                                                              a(z(f(i(1, 2, 3)))),
 *
 *                                                                              a(z(g(h(1, 2, 3)))),
 *                                                                              a(z(g(i(1, 2, 3)))),
 *
 *                                                                              // b (same as above, but b instead of a)
 *                                                                              b(d(h(1, 2, 3))),
 *                                                                              b(d(i(1, 2, 3))),
 *
 *                                                                              b(e(h(1, 2, 3))),
 *                                                                              b(e(i(1, 2, 3))),
 *
 *                                                                              b(f(h(1, 2, 3))),
 *                                                                              b(f(i(1, 2, 3))),
 *
 *                                                                              b(g(h(1, 2, 3))),
 *                                                                              b(g(i(1, 2, 3))),
 *
 *                                                                              // c (same as above, but c instead of b/a)
 *                                                                              c(d(h(1, 2, 3))),
 *                                                                              c(d(i(1, 2, 3))),
 *
 *                                                                              c(e(h(1, 2, 3))),
 *                                                                              c(e(i(1, 2, 3))),
 *
 *                                                                              c(f(h(1, 2, 3))),
 *                                                                              c(f(i(1, 2, 3))),
 *
 *                                                                              c(g(h(1, 2, 3))),
 *                                                                              c(g(i(1, 2, 3)))
 *                                                                          ]
 *
 *                                                                      An optional padding array can be prepended to each argument array
 *                                                                      or to a specific function by wrapping it in an array prepended with the padding array
 *                                                                      or to a composition of functions (already an array).
 *
 *                                                                      The available options for the padding array are:
 *
 *                                                                          - cartesianComposition.OPTIONAL: makes that entire argument array or specific function
 *                                                                                                           or specific composition of functions optional,
 *                                                                                                           meaning that it will be used for some compositions
 *                                                                                                           while skipped for others.
 *
 *                                                                      An example is worth a thousand words:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [a, b, c], // A
 *                                                                            [
 *                                                                              // Padding array with options.
 *                                                                              // In this case, this entire array of functions (B) is optional
 *                                                                              // and will be used for some compositions while skipped for others.
 *                                                                              [cartesianComposition.OPTIONAL],
 *                                                                              d, e, f, g
 *                                                                            ], // B
 *                                                                            [h, i] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      Will return:
 *
 *                                                                          [
 *                                                                              // a
 *                                                                              a(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              a(h(1,2,3)),
 *
 *                                                                              a(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              a(i(1,2,3)),
 *
 *                                                                              a(e(h(1, 2, 3))),
 *                                                                              a(e(i(1, 2, 3))),
 *
 *                                                                              a(f(h(1, 2, 3))),
 *                                                                              a(f(i(1, 2, 3))),
 *
 *                                                                              a(g(h(1, 2, 3))),
 *                                                                              a(g(i(1, 2, 3))),
 *
 *                                                                              // b
 *                                                                              b(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              b(h(1,2,3)),
 *
 *                                                                              b(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              b(i(1,2,3)),
 *
 *                                                                              b(e(h(1, 2, 3))),
 *                                                                              b(e(i(1, 2, 3))),
 *
 *                                                                              b(f(h(1, 2, 3))),
 *                                                                              b(f(i(1, 2, 3))),
 *
 *                                                                              b(g(h(1, 2, 3))),
 *                                                                              b(g(i(1, 2, 3))),
 *
 *                                                                              // c
 *                                                                              c(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              c(h(1,2,3)),
 *
 *                                                                              c(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition (`A x C`):
 *                                                                              c(i(1,2,3)),
 *
 *                                                                              c(e(h(1, 2, 3))),
 *                                                                              c(e(i(1, 2, 3))),
 *
 *                                                                              c(f(h(1, 2, 3))),
 *                                                                              c(f(i(1, 2, 3))),
 *
 *                                                                              c(g(h(1, 2, 3))),
 *                                                                              c(g(i(1, 2, 3)))
 *
 *                                                                          ]
 *
 *                                                                      Whereas this:
 *
 *                                                                          const ret = cartesianComposition(
 *                                                                            [a, b, c], // A
 *                                                                            [
 *                                                                              [cartesianComposition.OPTIONAL],
 *                                                                              d, e, f, g
 *                                                                            ], // B
 *                                                                            [
 *                                                                              h,
 *                                                                              [
 *                                                                                [cartesianComposition.OPTIONAL], // `i` is optional.
 *                                                                                i
 *                                                                              ]
 *                                                                            ] // C
 *                                                                          )(1, 2, 3);
 *
 *                                                                      Will return this:
 *
 *                                                                          [
 *                                                                              // a
 *                                                                              a(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate these compositions (`A x C`):
 *                                                                              a(h(1, 2, 3)),
 *
 *                                                                              a(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, as well as the specific function "i", it will also generate these compositions:
 *                                                                              a(i(1, 2, 3)),
 *                                                                              a(d(1, 2, 3)),
 *                                                                              a(1, 2, 3),
 *
 *                                                                              // Now it's time for functions "e", "f" and "g":
 *                                                                              a(e(h(1, 2, 3))),
 *                                                                              a(e(i(1, 2, 3))),
 *                                                                              a(e(1, 2, 3)),
 *
 *                                                                              a(f(h(1, 2, 3))),
 *                                                                              a(f(i(1, 2, 3))),
 *                                                                              a(f(1, 2, 3)),
 *
 *                                                                              a(g(h(1, 2, 3))),
 *                                                                              a(g(i(1, 2, 3))),
 *                                                                              a(g(1, 2, 3)),
 *
 *                                                                              // And the same will apply to b and c:
 *                                                                              // b
 *                                                                              b(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition `A x C`:
 *                                                                              b(h(1, 2, 3)),
 *
 *                                                                              b(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, as well as the specific function "i", it will also generate these compositions:
 *                                                                              b(i(1, 2, 3)),
 *                                                                              b(d(1, 2, 3)),
 *                                                                              b(1, 2, 3),
 *
 *                                                                              // Now it's time for functions "e", "f" and "g":
 *                                                                              b(e(h(1, 2, 3))),
 *                                                                              b(e(i(1, 2, 3))),
 *                                                                              b(e(1, 2, 3)),
 *
 *                                                                              b(f(h(1, 2, 3))),
 *                                                                              b(f(i(1, 2, 3))),
 *                                                                              b(f(1, 2, 3)),
 *
 *                                                                              b(g(h(1, 2, 3))),
 *                                                                              b(g(i(1, 2, 3))),
 *                                                                              b(g(1, 2, 3)),
 *
 *                                                                              // c
 *                                                                              c(d(h(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, it will also generate this composition `A x C`:
 *                                                                              c(h(1, 2, 3)),
 *
 *                                                                              c(d(i(1, 2, 3))),
 *
 *                                                                              // As the `B` array is optional, as well as the specific function "i", it will also generate these compositions:
 *                                                                              c(i(1, 2, 3)),
 *                                                                              c(d(1, 2, 3)),
 *                                                                              c(1, 2, 3),
 *
 *                                                                              // Now it's time for functions "e", "f" and "g":
 *                                                                              c(e(h(1, 2, 3))),
 *                                                                              c(e(i(1, 2, 3))),
 *                                                                              c(e(1, 2, 3)),
 *
 *                                                                              c(f(h(1, 2, 3))),
 *                                                                              c(f(i(1, 2, 3))),
 *                                                                              c(f(1, 2, 3)),
 *
 *                                                                              c(g(h(1, 2, 3))),
 *                                                                              c(g(i(1, 2, 3))),
 *                                                                              c(g(1, 2, 3))
 *                                                                          ]
 *
 *                                                                      Example:
 *
 *                                                                          const a = (...res) => `a(${res.join(", ")})`;
 *                                                                          const b = (...res) => `b(${res.join(", ")})`;
 *                                                                          const c = (...res) => `c(${res.join(", ")})`;
 *                                                                          const d = (...res) => `d(${res.join(", ")})`;
 *                                                                          const e = (...res) => `e(${res.join(", ")})`;
 *                                                                          const f = (...res) => `f(${res.join(", ")})`;
 *                                                                          const g = (...res) => `g(${res.join(", ")})`;
 *                                                                          const h = (...res) => `h(${res.join(", ")})`;
 *                                                                          const i = (...res) => `i(${res.join(", ")})`;
 *
 *                                                                          const res = cartesianComposition(
 *                                                                            [
 *                                                                              a,
 *                                                                              b,
 *                                                                              c
 *                                                                            ],
 *                                                                            [
 *                                                                              [cartesianComposition.OPTIONAL],
 *                                                                              d,
 *                                                                              e,
 *                                                                              f,
 *                                                                              g
 *                                                                            ],
 *                                                                            [
 *                                                                              h,
 *                                                                              [[cartesianComposition.OPTIONAL], i]
 *                                                                            ]
 *                                                                          )(1, 2, 3);
 *                                                                          console.log(res);
 *
 * @return {Function} The cartesian composition function which, if called, will return an array of the results of the cartesian composition.
 *                    An empty array will be returned when calling the returned function if this function is called with an empty array.
 */
const cartesianComposition =
  (...args) =>
  (...params) => {
    const l = args.length;
    if (!l) {
      return [];
    }
    const ret = [];
    const stack = [];
    const optionsPaddingArrayMap = {};
    const alreadyVisitedOptionsMap = {};
    const alreadyVisitedCompositionOfFunctionsOptionsMap = {};
    const alreadyComposedPathsMap = {};

    const addToStack = (argIndex, path = []) => {
      const arg = args[argIndex];
      const l = arg.length;
      for (let i = l - 1; i >= 0; i--) {
        const possibleFn = arg[i];
        const possibleFnIsArray = isArray(possibleFn);
        if (
          i === 0 &&
          possibleFnIsArray &&
          areArrayItemsAllCoercibleToNumber(possibleFn)
        ) {
          // Options padding array (it's always the first and it's an array).
          if (!alreadyVisitedOptionsMap[argIndex]) {
            const options = possibleFn;
            for (const option of options) {
              optionsPaddingArrayMap[argIndex] = optionsPaddingArrayMap[
                argIndex
              ] || {
                optionsMap: {},
                specificComposition: {},
              };
              optionsPaddingArrayMap[argIndex].optionsMap[option] = true;
            }
            alreadyVisitedOptionsMap[argIndex] = true;
          }
        } else {
          // Function or array of functions to compose eventually prepended
          // with an optional options padding array.
          if (possibleFnIsArray) {
            // Array of functions to compose.
            const fns = [];
            for (let j = 0; j < possibleFn.length; j++) {
              const innerCompositionPossibleFn = possibleFn[j];
              if (j === 0 && isArray(innerCompositionPossibleFn)) {
                // Options padding array (it's always the first and it's an array).
                if (
                  !alreadyVisitedCompositionOfFunctionsOptionsMap[
                    `${argIndex}.${i}`
                  ]
                ) {
                  const options = innerCompositionPossibleFn;
                  for (const option of options) {
                    optionsPaddingArrayMap[argIndex] = optionsPaddingArrayMap[
                      argIndex
                    ] || {
                      optionsMap: {},
                      specificComposition: {},
                    };
                    optionsPaddingArrayMap[argIndex].specificComposition[i] =
                      optionsPaddingArrayMap[argIndex].specificComposition[
                        i
                      ] || {
                        optionsMap: {},
                      };
                    optionsPaddingArrayMap[argIndex].specificComposition[
                      i
                    ].optionsMap[option] = true;
                  }
                  alreadyVisitedCompositionOfFunctionsOptionsMap[
                    `${argIndex}.${i}`
                  ] = true;
                }
              } else {
                // Function.
                fns.push(innerCompositionPossibleFn);
              }
            }
            // Composition of functions.
            // Push to stack.
            const node = {
              fns,
              argIndex,
              index: i,
            };
            stack.push({
              node,
              path: path.concat([node]),
            });
          } else {
            // Function.
            // Push to stack.
            const node = {
              fns: [possibleFn],
              argIndex,
              index: i,
            };
            stack.push({
              node,
              path: path.concat([node]),
            });
          }
        }
      }
    };

    const hasOption = (optionCode, argIndex, index) => {
      return hasNestedPropertyValue(
        optionsPaddingArrayMap,
        typeof index === "undefined"
          ? [argIndex, "optionsMap", optionCode]
          : [argIndex, "specificComposition", index, "optionsMap", optionCode]
      );
    };

    const composeRes = path =>
      compose(...path.flatMap(node => node.fns))(...params);

    addToStack(0);
    while (stack.length) {
      const current = stack.pop();
      const currentPath = current.path;
      if (currentPath.length === l) {
        const optionals = [];
        for (let i = 0; i < currentPath.length; i++) {
          const currentPathNode = currentPath[i];
          if (
            hasOption(
              cartesianComposition.OPTIONAL,
              currentPathNode.argIndex
            ) ||
            hasOption(
              cartesianComposition.OPTIONAL,
              currentPathNode.argIndex,
              currentPathNode.index
            )
          ) {
            optionals.push(i);
          }
        }
        const compositionRes = composeRes(currentPath);
        ret.push(compositionRes);
        const optionalsCombinations =
          yieldUniqueProgressiveIncrementalCombinations(optionals);
        for (const optionalsCombination of optionalsCombinations) {
          const path = currentPath.filter(
            node => optionalsCombination.indexOf(node.argIndex) === -1
          );
          const keys = [path.length].concat(
            path.flatMap(node => [node.argIndex, node.index])
          );
          if (!hasNestedPropertyValue(alreadyComposedPathsMap, keys)) {
            const compositionRes = composeRes(path);
            ret.push(compositionRes);
            setNestedPropertyValue(alreadyComposedPathsMap, keys, true);
          }
        }
      } else {
        const nextIndex = current.node.argIndex + 1;
        addToStack(nextIndex, currentPath);
      }
    }

    return ret;
  };

/**
 * @type {number}
 */
cartesianComposition.OPTIONAL = 1;

export default cartesianComposition;
