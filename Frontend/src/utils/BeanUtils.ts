class BeanUtils {
    /**
     * Copy properties from the source object to the target object.
     * @param source - The source object.
     * @param target - The target object.
     */
    static copyProperties<T, U>(source: T, target: U): U {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key) && key in target) {
                (target as any)[key] = (source as any)[key];
            }
        }
        return target;
    }

    /**
     * Copy non-null properties from the source object to the target object.
     * @param source - The source object.
     * @param target - The target object.
     */
    static copyNonNullProperties<T, U>(source: T, target: U): U {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key) && key in target && (source as any)[key] !== null) {
                (target as any)[key] = (source as any)[key];
            }
        }
        return target;
    }

    /**
     * Check if an object is empty (has no enumerable properties).
     * @param obj - The object to check.
     * @returns True if the object is empty, otherwise false.
     */
    static isEmpty(obj: any): boolean {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Clone an object deeply.
     * @param obj - The object to clone.
     * @returns A deep clone of the object.
     */
    static deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }
}

// Example usage:
interface Source {
    name: string;
    age: number;
    address?: string;
}

interface Target {
    name: string;
    age: number;
    email: string;
}

const source: Source = { name: "John", age: 30, address: "123 Main St" };
const target: Target = { name: "", age: 0, email: "john@example.com" };

// Copy properties
BeanUtils.copyProperties(source, target);
console.log(target); // { name: "John", age: 30, email: "john@example.com" }

// Copy non-null properties
const target2: Target = { name: "", age: 0, email: "john@example.com" };
BeanUtils.copyNonNullProperties(source, target2);
console.log(target2); // { name: "John", age: 30, email: "john@example.com" }

// Check if an object is empty
console.log(BeanUtils.isEmpty({})); // true
console.log(BeanUtils.isEmpty({ name: "John" })); // false

// Deep clone an object
const clonedSource = BeanUtils.deepClone(source);
console.log(clonedSource); // { name: "John", age: 30, address: "123 Main St" }
