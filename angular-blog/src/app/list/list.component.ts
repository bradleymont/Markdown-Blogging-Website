import { Component, OnInit } from '@angular/core';
import { Post, BlogService } from '../blog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  blogPosts: Post[];

  // make BlogService available through dependency injection
  constructor(private blogService: BlogService, private router: Router)
  {
    blogService.subscribeToDelete((postidToRemove: number) => {
      // remove the post with postidToRemove from blogPosts
      this.blogPosts = this.blogPosts.filter(post => (post.postid != postidToRemove));
    });

    blogService.subscribeToUpdate((updatedPost: Post) => {
      // update the saved post in blogPosts
      let updatedIndex: number = this.blogPosts.findIndex(post => (post.postid == updatedPost.postid));
      this.blogPosts[updatedIndex] = updatedPost;
    });

    blogService.subscribeToNewPost((newPost: Post) => {
      // add the new post to blogPosts
      this.blogPosts.push(newPost);
    });
  }

  // retrieves the blog posts from the database
  async getBlogPosts(): Promise<void>
  {
    try
    {
      this.blogPosts = await this.blogService.fetchPosts(this.blogService.getUsername());
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // sets the clicked post as the "current draft"
  selectPost(post: Post): void
  {
    this.blogService.setCurrentDraft(post);

    // open the edit view
    this.router.navigate(['/', 'edit', post.postid]);
  }

  // for when the user clicks "New Post"
  addPost(): void
  {
    // get the postid for the new post
    let newPostid: number = 1;
    if (this.blogPosts.length)
    {
      // set the new postid to be 1 higher than the max postid of the user
      newPostid = this.blogPosts[this.blogPosts.length - 1].postid + 1;
    }

    // create a new empty post
    let newPostDate: Date = new Date();
    let emptyPost: Post = {
      postid: newPostid,
      created: newPostDate,
      modified: newPostDate,
      title: '',
      body: ''
    };

    // set the new empty post as the current draft
    this.blogService.setCurrentDraft(emptyPost);

    // set unsavedPost to true
    this.blogService.setUnsaved(true);

    // open the edit view
    this.router.navigate(['/', 'edit', newPostid]);
  }

  async ngOnInit(): Promise<void> {
    try
    {
      await this.getBlogPosts();
    }
    catch (err)
    {
      console.log(err);
    }
  }
}
