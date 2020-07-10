export function convertMaxPayload (value: string): number {

    if (typeof value !== "string" || !/^[0-9]{1,6}(kb|mb|b)$/.test(value)) {
        throw Error("Value for convertMaxPayload function must be string and matches Regexp ^[0-9]{1,6}(kb|mb|b)$");
    }

    let value_number = 0;

    if (/kb$/ig.test(value)) {
        value_number = parseInt(value.replace(/kb$/ig,"")) * 1024;
    }

    if (/mb$/ig.test(value)) {
        value_number = parseInt(value.replace(/mb$/ig,"")) * 1024 * 1024;
    }

    if (/b$/ig.test(value)) {
        value_number = parseInt(value.replace(/b$/ig,""));
    }

    return value_number;
}