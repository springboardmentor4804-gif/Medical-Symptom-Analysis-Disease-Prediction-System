import "../styles/Form.css";

function InputField({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    name,
    required = false
}) {
    return (
        <div className="form-group">

            <label>

                {label}

            </label>

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                name={name}
                required={required}
            />

        </div>
    );
}

export default InputField;