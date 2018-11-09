package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/disintegration/imaging"
	"github.com/gorilla/mux"
)

func main() {

	// Test using:
	// curl --request POST --data-binary 'data=@filename.jpg' -H "Content-Type: image/jpeg" http://localhost:3002/greyscale --output - | imgcat

	port := os.Getenv("API_PORT")
	if port == "" {
		port = "3002"
	}

	var router = mux.NewRouter()
	router.HandleFunc("/", welcome).Methods("GET")
	router.HandleFunc("/healthcheck", healthCheck).Methods("GET")
	router.HandleFunc("/greyscale", greyscale).Methods("POST")

	log.Println("Photo Filter API listening on http://localhost:" + port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

func welcome(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "Welcome to the photo-filter API")
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode("OK")
}

func greyscale(w http.ResponseWriter, r *http.Request) {
	const MaxMemory = 20 * 1024 * 1024 // 20MB

	defer r.Body.Close()
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading body: %v", err)
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	reader := bytes.NewReader(body)

	_, format, err := image.DecodeConfig(reader)

	if err != nil {
		log.Println("Error detecting format:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	reader.Seek(0, 0)
	decoded, err := imaging.Decode(reader)

	if err != nil {
		log.Println("Error decoding photo:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	log.Printf("Converting image to greyscale")
	img := imaging.Grayscale(decoded)

	switch format {
	case "jpeg":
		err = jpeg.Encode(w, img, nil)
	case "png":
		err = png.Encode(w, img)
	case "gif":
		err = gif.Encode(w, img, nil)
	default:
		err = errors.New("Unsupported file type")
	}
}
