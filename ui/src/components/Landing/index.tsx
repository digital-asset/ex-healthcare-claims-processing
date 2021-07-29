import "./Landing.css";

const Landing = () => {
  return (
    <div className="px-20 bg-blue Landing object-center">
      <img className="h-6 text-white alata" src="/DAML_Logo_Blue.svg" alt="" />
      <div className="alata text-left text-4xl text-white landing-header">
        Daml driven healthcare
      </div>
      <div className="alata text-left text-base text-white text-opacity-60 landing-description">
        A demo application to show how DAML can jump start your project.
      </div>
      <img alt="" src="/healthcare-professionals.svg" />
    </div>
  );
};
export default Landing;
