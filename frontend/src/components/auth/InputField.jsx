function InputField({
    icon,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false
}) {

    return (

        <div className="input-group">

            {icon && icon}

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
            />

        </div>

    );

}

export default InputField;
