import "../styles/Form.css";

function SelectField({
    label,
    value,
    onChange,
    name,
    options
}) {

    return (

        <div className="form-group">

            <label>

                {label}

            </label>

            <select
                value={value}
                onChange={onChange}
                name={name}
            >

                {options.map((option) => (

                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>

                ))}

            </select>

        </div>

    );

}

export default SelectField;