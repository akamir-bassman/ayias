import { Admin } from "@decentverse/client";
const AdminWrapper = () => {
  const uri = `${process.env.NEXT_PUBLIC_REACT_APP_API_PROTOCOL}://${process.env.NEXT_PUBLIC_REACT_APP_API_HOST}:${process.env.NEXT_PUBLIC_REACT_APP_API_PORT}/graphql`;
  return <Admin uri={uri} />;
};
export default AdminWrapper;
