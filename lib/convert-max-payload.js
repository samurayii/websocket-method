module.exports = (value) => {

    if (/kb$/ig.test(value)) {
        value = parseInt(value.replace(/kb$/ig,"")) * 1024;
    }

    if (/mb$/ig.test(value)) {
        value = parseInt(value.replace(/mb$/ig,"")) * 1024 * 1024;
    }

    if (/b$/ig.test(value)) {
        value = parseInt(value.replace(/b$/ig,""));
    }

    return value;
};