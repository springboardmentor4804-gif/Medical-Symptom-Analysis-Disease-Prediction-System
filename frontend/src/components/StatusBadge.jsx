import "../styles/StatusBadge.css";

function StatusBadge({ status }) {

    const badgeClass = status.toLowerCase();

    return (

        <span className={`status-badge ${badgeClass}`}>

            {status}

        </span>

    );

}

export default StatusBadge;