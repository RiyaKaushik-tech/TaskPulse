import { combineReducers, configureStore } from "@reduxjs/toolkit"
import userReducer from "./slice/userSlice"
import themeReducer from "./slice/themeSlice"
import React from "react"
import storage from "redux-persist/lib/storage"
import { persistReducer, persistStore } from "redux-persist"

const rootReducer = combineReducers({
  user: userReducer,
  theme: themeReducer,
})

const persistConfig = {
  key: "root",
  storage,
  version: 1,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({ serializableCheck: false })
  },
})

export const persistor = persistStore(store)