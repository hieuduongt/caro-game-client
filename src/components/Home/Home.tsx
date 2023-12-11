import { FC } from "react";

interface HomeProps extends React.HTMLAttributes<HTMLDivElement> {

}

const Home: FC<HomeProps> = (props) => {
    return (
        <div className='Home'>
            Home
        </div>
    )
}

export default Home;