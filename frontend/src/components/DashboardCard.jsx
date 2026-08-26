import { Link } from "react-router-dom";

function DashboardCard({
    to,
    icon,
    title,
    description,
    className = ""
}) {
    return (
        <Link
            to={to}
            className={`dashboard-card ${className}`}
        >
            <div className="card-icon">
                {icon}
            </div>

            <h3>{title}</h3>

            <p>{description}</p>

            <div className="card-footer">
                Open →
            </div>
        </Link>
    );
}

export default DashboardCard;