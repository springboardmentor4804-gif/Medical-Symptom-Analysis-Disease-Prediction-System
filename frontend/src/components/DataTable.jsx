import "../styles/DataTable.css";

function DataTable({ columns, data }) {

    return (

        <div className="table-container">

            <table className="custom-table">

                <thead>

                    <tr>

                        {columns.map((column) => (

                            <th key={column.key}>

                                {column.label}

                            </th>

                        ))}

                    </tr>

                </thead>

                <tbody>

                    {data.length > 0 ? (

                        data.map((row, index) => (

                            <tr key={index}>

                                {columns.map((column) => (

                                    <td key={column.key}>

                                        {row[column.key]}

                                    </td>

                                ))}

                            </tr>

                        ))

                    ) : (

                        <tr>

                            <td
                                colSpan={columns.length}
                                className="no-data"
                            >

                                No records found.

                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default DataTable;