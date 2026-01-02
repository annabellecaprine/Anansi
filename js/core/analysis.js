/*
 * Anansi Core: Script Analyzer
 * File: js/core/analysis.js
 * Purpose: Static analysis of user scripts using Esprima/Escodegen.
 * Capabilities: Read/Write detection, Forbidden syntax checks, Variable declaration inference.
 */

(function (A) {
    'use strict';

    const Analyzer = {
        /**
         * Scans a script to determine its reads, writes, and safety.
         */
        scan: function (code) {
            const report = {
                safe: true,
                violations: [],
                reads: [],
                writes: [],
                functions: []
            };

            if (!code || !code.trim()) return report;

            // Lazy Check
            if (typeof window.esprima === 'undefined') {
                report.violations.push('Analysis Engine (Esprima) missing or not loaded.');
                // Try to warn once
                if (!window._esprimaWarned) {
                    console.warn('[Analysis] Esprima not detected on global scope.');
                    window._esprimaWarned = true;
                }
                return report;
            }

            let ast;
            // Support both modern (parseScript) and legacy (parse) Esprima APIs
            const parseFn = (window.esprima.parseScript || window.esprima.parse);

            if (typeof parseFn !== 'function') {
                report.violations.push('Esprima loaded but no parse method found.');
                console.error('[Analysis] Invalid Esprima Object:', window.esprima);
                return report;
            }

            try {
                ast = parseFn(code, { range: true, loc: true });
            } catch (e) {
                report.safe = false;
                report.violations.push(`Syntax Error: ${e.message}`);
                return report;
            }

            // Recursive Walker
            function walk(node, scope) {
                if (!node) return;

                // Check Forbidden Syntax
                if (node.type === 'Eval' || (node.type === 'CallExpression' && node.callee.name === 'eval')) {
                    report.safe = false;
                    report.violations.push('Use of "eval" is forbidden.');
                }
                if (node.type === 'FunctionConstructor') { // new Function() check tough in pure AST without type checking, but name check helps
                    // Esprima doesn't have a specific type for this, it's NewExpression with callee.name="Function"
                }
                if (node.type === 'NewExpression' && node.callee.name === 'Function') {
                    report.safe = false;
                    report.violations.push('Dynamic "new Function()" is forbidden.');
                }

                // Detect Reads/Writes on Context
                if (node.type === 'MemberExpression') {
                    // Check for context.x or ctx.x
                    let objectName = '';
                    if (node.object.type === 'Identifier') objectName = node.object.name;

                    // Simple heuristic: if object is 'context' or 'ctx', we track it
                    if (objectName === 'context' || objectName === 'ctx') {
                        let propName = '';
                        if (node.property.type === 'Identifier') propName = node.property.name;
                        else if (node.property.type === 'Literal') propName = node.property.value;

                        if (propName) {
                            // Determine if it's a Write (Assignment)
                            // We need to look at the PARENT. 
                            // Since standard recursive walk doesn't easily pass parent, we assume Read unless proven otherwise
                            // Actually, a better walker passes parent.
                            // For MVP, we'll collect ALL touches.
                            // To distinguish R/W, we'd check if this node is the 'left' of an AssignmentExpression.
                        }
                    }
                }

                // Traverse Children
                for (let key in node) {
                    if (node.hasOwnProperty(key)) {
                        let child = node[key];
                        if (typeof child === 'object' && child !== null) {
                            if (Array.isArray(child)) {
                                child.forEach(c => walk(c, scope));
                            } else {
                                if (child.type) walk(child, scope);
                            }
                        }
                    }
                }
            }

            // Advanced Walker with Parent Tracking
            function traverse(node, visitor, parent = null) {
                if (!node) return;
                visitor(node, parent);
                for (let key in node) {
                    if (node.hasOwnProperty(key)) {
                        let child = node[key];
                        if (typeof child === 'object' && child !== null) {
                            if (Array.isArray(child)) {
                                child.forEach(c => traverse(c, visitor, node));
                            } else if (child.type) {
                                traverse(child, visitor, node);
                            }
                        }
                    }
                }
            }

            traverse(ast, (node, parent) => {
                // Check Global Assignments (potential pollution)
                // Check Context Access
                if (node.type === 'MemberExpression') {
                    let obj = node.object;
                    let rootName = '';

                    // Unwrap chain context.vars.mood -> context
                    let current = obj;
                    while (current.type === 'MemberExpression') {
                        current = current.object;
                    }
                    if (current.type === 'Identifier') rootName = current.name;

                    if (rootName === 'context' || rootName === 'ctx') {
                        // For display, we want the full path
                        // We can reconstruct it from the source if we had ranges, or verify logic
                        // For now, let's just grab the immediate property being accessed/written
                        // If it's context.foo.bar = 5, the MemberExpression is context.foo.bar
                        // The property is 'bar'.
                        // But we want to know it's context...

                        // Let's try to flatten the full name
                        let fullPath = '';
                        function flatten(n) {
                            if (n.type === 'Identifier') return n.name;
                            if (n.type === 'MemberExpression') {
                                let prop = (n.property.type === 'Identifier') ? n.property.name : n.property.value;
                                return flatten(n.object) + '.' + prop;
                            }
                            return '?';
                        }

                        fullPath = flatten(node);

                        // Check if Write
                        let isWrite = false;
                        if (parent && parent.type === 'AssignmentExpression' && parent.left === node) {
                            isWrite = true;
                        } else if (parent && parent.type === 'UpdateExpression' && parent.argument === node) {
                            isWrite = true; // ++ or --
                        }

                        if (isWrite) {
                            if (!report.writes.includes(fullPath)) report.writes.push(fullPath);
                        } else {
                            if (!report.reads.includes(fullPath)) report.reads.push(fullPath);
                        }
                    }
                }

                // Block 'window' access
                if (node.type === 'Identifier' && node.name === 'window') {
                    // Only violation if it's not a property (e.g. obj.window is fine)
                    if (parent.type !== 'MemberExpression' || parent.object === node) {
                        report.violations.push('Global "window" access is forbidden.');
                        report.safe = false;
                    }
                }

                // Block 'document' access
                if (node.type === 'Identifier' && node.name === 'document') {
                    if (parent.type !== 'MemberExpression' || parent.object === node) {
                        report.violations.push('Global "document" access is forbidden.');
                        report.safe = false;
                    }
                }
            });

            return report;
        }
    };

    A.Analyzer = Analyzer;

})(window.Anansi);
