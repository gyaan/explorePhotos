package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"sync"
	"time"

	"gopkg.in/mgo.v2"
)

//some global const

const perPagePhoto int = 50
const flickerApiUrl string = "https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=00b8e8a000238defd8704f7c6bdbe130&format=json&nojsoncallback=1&text=puppies"

//struct for api response
type payload struct {
	Photos photos `json:photos`
	Stat   string `json:state`
}

//struct for photos listing
type photos struct {
	Page    int     `json:page`
	Pages   int     `json:pages`
	Perpage int     `json:perpage`
	Total   int     `json:total`
	Photo   []photo `json:photo`
}

//struct for individual photo
type photo struct {
	Id             string `json: id`
	Owner          string `json:owner`
	Secret         string `json:secret`
	Server         string `json:server`
	Farm           int    `json:farm`
	Title          string `json:title`
	Ispublic       int    `json:ispublic`
	Isfriend       int    `json:isfriend`
	Isfmaily       int    `json:isfmaily`
	Url            string `json:url`
	ThumbUrl       string `json:thumbUrl`
	UpVotesCount   int    `json:upVotesCount`
	DownVotesCount int    `json:downVotesCount`
}

// this will return photos list per page
func getFlickrPhotos(pageNumber int) {

	// fmt.Println(pageNumber)

	url := flickerApiUrl + "&page=" + strconv.Itoa(pageNumber) + "&per_page=" + strconv.Itoa(perPagePhoto)

	// fmt.Println(url)
	res, err := http.Get(url)

	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)

	if err != nil {
		panic(err)
	}

	// fmt.Println(body)

	var p payload

	err = json.Unmarshal([]byte(body), &p)

	if err != nil {
		panic(err)
	}
	addPhotosToDb(p.Photos.Photo)
}

//to store photos details in mongoDB
func addPhotosToDb(Photos []photo) {

	session, err := mgo.Dial("localhost")

	if err != nil {
		panic(err)
	}
	defer session.Close()

	uc := session.DB("explorePhotos").C("photos")

	for _, photo := range Photos {

		photo.Url = "https://farm" + strconv.Itoa(photo.Farm) + ".staticflickr.com/" + photo.Server + "/" + photo.Id + "_" + photo.Secret + "_b.jpg"
		photo.ThumbUrl = "https://farm" + strconv.Itoa(photo.Farm) + ".staticflickr.com/" + photo.Server + "/" + photo.Id + "_" + photo.Secret + "_n.jpg"
		photo.UpVotesCount = 0
		photo.DownVotesCount = 0

		err = uc.Insert(photo)
		if err != nil {
			panic(err)
		}
		// fmt.Println(photo)
	}

}

func main() {

	url := flickerApiUrl + "&page=1&per_page=" + strconv.Itoa(perPagePhoto)

	res, err := http.Get(url)

	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)

	if err != nil {
		panic(err)
	}

	// fmt.Println(body)

	var p payload

	err = json.Unmarshal([]byte(body), &p)

	if err != nil {
		panic(err)
	}
	// add first page photos to db
	addPhotosToDb(p.Photos.Photo)

	totalPages := p.Photos.Pages
	//first page photos we already got lets call go routins for other pages

	fmt.Println(totalPages)

        //bench marking lets see how much time its take 
	t1 := time.Now()

	//  with go routines
	var wg sync.WaitGroup
	
	for i := 2; i <= totalPages; i++ { //execute this for all pages
		println(i, "page number")
		wg.Add(1)
		go func(page int) {
			println(page)
			defer wg.Done()
			getFlickrPhotos(page) //these functions will execute concurrently 
		}(i)
	}
	wg.Wait()

	/*
		//without go routines to check how much time it takes 
		for i := 2; i <= totalPages; i++ { //execute this for all pages
			getFlickrPhotos(i)
		}
	*/
	t2 := time.Now()
	fmt.Println("time taken: ", t2.Sub(t1))
}
