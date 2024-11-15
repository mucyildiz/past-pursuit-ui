export const saveUserName = (name: string) => {
  localStorage.setItem("userName", name);
};

export const getUserName = () => {
  return localStorage.getItem("userName");
};
