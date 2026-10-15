"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularBomReferenceError = void 0;
exports.assertNoBomCycle = assertNoBomCycle;
var CircularBomReferenceError = /** @class */ (function (_super) {
    __extends(CircularBomReferenceError, _super);
    function CircularBomReferenceError(cyclePath) {
        var _this = _super.call(this, "Circular BOM reference detected along path: ".concat(cyclePath.join(' -> '))) || this;
        _this.cyclePath = cyclePath;
        _this.name = 'CircularBomReferenceError';
        return _this;
    }
    return CircularBomReferenceError;
}(Error));
exports.CircularBomReferenceError = CircularBomReferenceError;
/**
 * Asserts that adding an edge `parentPartId -> childPartId` does not create a circular dependency.
 * Throws `CircularBomReferenceError` if a cycle is found.
 */
function assertNoBomCycle(parentPartId_1, candidateChildPartId_1, provider_1) {
    return __awaiter(this, arguments, void 0, function (parentPartId, candidateChildPartId, provider, maxDepth) {
        function dfs(currentId, depth) {
            return __awaiter(this, void 0, void 0, function () {
                var children, _i, children_1, childId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (depth > maxDepth) {
                                throw new Error("BOM hierarchy traversal exceeded maximum safe depth of ".concat(maxDepth));
                            }
                            if (currentId === parentPartId) {
                                throw new CircularBomReferenceError(__spreadArray([], path, true));
                            }
                            if (visited.has(currentId)) {
                                return [2 /*return*/];
                            }
                            visited.add(currentId);
                            return [4 /*yield*/, provider.getChildren(currentId)];
                        case 1:
                            children = _a.sent();
                            _i = 0, children_1 = children;
                            _a.label = 2;
                        case 2:
                            if (!(_i < children_1.length)) return [3 /*break*/, 5];
                            childId = children_1[_i];
                            path.push(childId);
                            return [4 /*yield*/, dfs(childId, depth + 1)];
                        case 3:
                            _a.sent();
                            path.pop();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        var visited, path;
        if (maxDepth === void 0) { maxDepth = 25; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // If parent directly equals child, it's an immediate self-loop
                    if (parentPartId === candidateChildPartId) {
                        throw new CircularBomReferenceError([parentPartId, candidateChildPartId]);
                    }
                    visited = new Set();
                    path = [parentPartId, candidateChildPartId];
                    return [4 /*yield*/, dfs(candidateChildPartId, 1)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
