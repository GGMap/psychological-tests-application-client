import React from "react";

function App() {
    const [like, setLike] = React.useState(0)
    const incrementLike = () => {setLike(like + 1)}
    const decrementLike = () => {setLike(like - 1)}
    return (
        <div className="App">
            <h1>{like}</h1>
            <button onClick={incrementLike}>Повышение</button>
            <button onClick={decrementLike}>Понижение</button>
        </div>
    );
}

export default App;
