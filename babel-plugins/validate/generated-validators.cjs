exports.validate = function (value) {
    return (value === null || value === undefined || value === '') === false;
}

exports.validateEmail = function (value) {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
};

exports.validatePhone = function (value) {
    return /^1[3-9]\\d{9}$/.test(value);
};
