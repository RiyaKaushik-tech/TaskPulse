import React from 'react'
import axiosInstance from "./axiosInstance"

const uploadImage = async(imageFile) => {
    const formData = new FormData();

    formData.append("image",imageFile);

   try {
    const response = await axiosInstance.post("/auth/uploadImage", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  } catch (error) {
    console.log(`Error uploading image: ${error.message}`)
    throw error
  }
}

export default uploadImage
