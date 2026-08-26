import "../../styles/Auth.css";

function AuthFormCard({
    title,
    subtitle,
    children,
    onSubmit
}) {

    return (

        <div className="auth-card">

            <h2>{title}</h2>

            <p>{subtitle}</p>

            <form onSubmit={onSubmit}>

                {children}

            </form>

        </div>

    );

}

export default AuthFormCard;
