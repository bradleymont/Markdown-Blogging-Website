import { Injectable } from '@angular/core';

export class Post {
  postid: number;
  created: Date;
  modified: Date;
  title: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  // the current "draft"
  private draft: Post = null;

  // the username of the currently authenticated user
  private username: string = this.retrieveUsernameFromJWT();

  // true if we are currently editing an unsaved post
  private unsavedPost = false;

  isUnsaved(): boolean
  {
    return this.unsavedPost;
  }

  setUnsaved(unsaved: boolean): void
  {
    this.unsavedPost = unsaved;
  }

  // callback to ensure the list component is updated after deleting a post
  deleteCallback = null;
  subscribeToDelete(callback): void
  {
    this.deleteCallback = callback;
  }

  // callback to ensure the list component is updated after updating a post
  updateCallback = null;
  subscribeToUpdate(callback): void
  {
    this.updateCallback = callback;
  }

  // callback to ensure the list component is updated after adding a new post
  newPostCallback = null;
  subscribeToNewPost(callback): void
  {
    this.newPostCallback = callback;
  }

  constructor() { }

  // sends an HTTP GET request to /api/:username and retrieves all blog posts by the user.
  // If successful, the returned promise resolves to a Post array (of Post[] type) that contains the user’s posts.
  // In case of error, the promise is rejected to Error(response_status_code).
  async fetchPosts(username: string): Promise<Post[]>
  {
    try
    {
      let res: Response = await fetch(`/api/${username}`, { method: 'GET', credentials: 'include' });
      let blogPosts: Promise<Post[]> = await res.json();
      return blogPosts;
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // sends an HTTP GET request to /api/:username/:postid and retrieves the particular post.
  // If successful, the returned promise resolves to a Post that corresponds to the retrieved post.
  // In case of error, the promise is rejected to Error(status_code).
  async getPost(username: string, postid: number): Promise<Post>
  {
    try
    {
      let res: Response = await fetch(`/api/${username}/${postid}`, { method: 'GET', credentials: 'include' });
      let blogPost: Promise<Post> = await res.json();
      return blogPost;
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // sends an HTTP POST request to /api/:username/:postid to save the new post in the server.
  // In case of error, the promise is rejected to Error(status_code).
  async newPost(username: string, post: Post): Promise<void>
  {
    try
    {
      await fetch(`/api/${username}/${post.postid}`, { 
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post) });

      this.newPostCallback(post);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // sends an HTTP PUT request to /api/:username/:postid to update the corresponding post in the server.
  // In case of error, the promise is rejected to Error(status_code).
  async updatePost(username: string, post: Post): Promise<void>
  {
    try
    {
      await fetch(`/api/${username}/${post.postid}`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post) });

      this.updateCallback(post);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // sends an HTTP DELETE request to /api/:username/:postid to delete the corresponding post from the server.
  // In case of error, the promise is rejected to Error(status_code).
  async deletePost(username: string, postid: number): Promise<void>
  {
    try
    {
      await fetch(`/api/${username}/${postid}`, { method: 'DELETE', credentials: 'include' });

      // so the list component can update
      this.deleteCallback(postid);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // “saves” the post as the current “draft”, so that it can be returned later when getCurrentDraft() is called.
  setCurrentDraft(post: Post): void
  {
    this.draft = post;
  }

  // returns the draft saved in the earlier setCurrentDraft() call.
  getCurrentDraft(): Post
  {
    return this.draft;
  }

  // retrieves the currently authenticated username from the JWT token
  retrieveUsernameFromJWT(): string
  {
    // get the JWT token
    let token: string = document.cookie;

    // extract the username from the JWT token
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // set username equal to the username from the token
    return JSON.parse(atob(base64)).usr;
  }

  // gets the currently authenticated username
  getUsername(): string
  {
    return this.username;
  }
}
