import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";

import Input from "../common/Input";

function RegisterForm() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        ì (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        
    };

  return <>

  </>;
}
export default RegisterForm;
