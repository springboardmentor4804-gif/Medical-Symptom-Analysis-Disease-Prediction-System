import "../styles/Form.css";

function TextAreaField({
    label,
    placeholder,
    value,
    onChange,
    rows = 4,
    name
}) {

    return (

        <div className="form-group">

            <label>

                {label}

            </label>

            <textarea
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                name={name}
            />

        </div>

    );

}

export default TextAreaField;