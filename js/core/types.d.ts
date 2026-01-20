/**
 * Global Type Definitions for Anansi
 * These allow checkJs to recognize global variables and window properties.
 */

interface Window {
    Anansi: any;
}

declare var Anansi: any;
declare var Quill: any;
declare var esprima: any;
interface Window {
    Anansi: any;
    _esprimaWarned: boolean;
    buildEntityDB: any;
    buildRelationshipDB: any;
    LogicEngine: any;
    QuillManager: any;
    RPG: any;
    renderLocationPanel: any;
}
