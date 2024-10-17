import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "./firebaseConfig";
import { BlogType } from "@/Types/all-types";
import { toast } from "react-toastify";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export async function saveUser(email: string, userName: string, uid: string) {
  try {
    const docRef = doc(db, "users", uid);
    const user = {
      email,
      userName,
      uid,
      userType: "user",
    };
    await setDoc(docRef, user);
  } catch (error) {
    console.log(error);
  }
}

export async function saveBlog({
  title,
  file,
  tag,
  content,
  slug,
  createdDate,
}: BlogType) {
  try {
    const uploadImage = async () => {
      if (!file) return;
      const imageRef = ref(
        storage,
        `images/blog-images/${makeImageName(file)}`
      );
      const uploadTask = uploadBytesResumable(imageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
          },
          (error) => {
            console.error("Upload error: ", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            resolve(downloadURL);
          }
        );
      });
    };

    const imageURL = await uploadImage();

    const newBlog = {
      title,
      tag,
      content,
      slug,
      createdDate,
      imageURL,
    };
    const collectionRef = collection(db, "blogs");
    const docRef = await addDoc(collectionRef, newBlog);

    const docRefToUpdate = doc(db, "blogs", docRef.id);
    await updateDoc(docRefToUpdate, {
      firebaseID: docRef.id,
    });
    toast.success("Blog Added Successfully!");
  } catch (error) {
    console.error("Error adding blog: ", error);
    toast.error("Couldn't add blog!");
  }
}

function makeImageName(file: File) {
  const imageName = file.name.split(".");
  const lastIndex = imageName.length - 1;
  const imageType = imageName[lastIndex];
  const newName = `${crypto.randomUUID()}.${imageType}`;
  return newName;
}

export async function DeleteBlog(id: string) {
  const docRef = doc(db, "blogs", id);
  await deleteDoc(docRef);
}
