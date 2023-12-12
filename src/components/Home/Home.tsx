import { FC } from "react";
import { IoMdLogIn } from "react-icons/io";
import { GiArchiveRegister } from "react-icons/gi";
import { Button, Flex } from 'antd';
import { VscAccount } from "react-icons/vsc";
import './Home.css';

interface HomeProps extends React.HTMLAttributes<HTMLDivElement> {

}

const Home: FC<HomeProps> = (props) => {
    return (
        <div className='home'>
            <Flex gap="small" wrap="wrap">
                <Button type="primary" icon={<IoMdLogIn size={16}/>} size={"large"}>
                    Login
                </Button>
                <Button type="default" icon={<GiArchiveRegister size={16}/>} size={"large"}>
                    Register
                </Button>
                <Button type="dashed" icon={<VscAccount size={16}/>} size={"large"}>
                    Play as guest
                </Button>
            </Flex>
        </div>
    )
}

export default Home;