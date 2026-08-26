import "../styles/EmptyState.css";

function EmptyState({ title, message }) {

    return (

        <div className="empty-state">

            <h2>{title}</h2>

            <p>{message}</p>

        </div>

    );

}

export default EmptyState;