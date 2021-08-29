import { Component, OnInit } from '@angular/core';
import { Post, BlogService } from '../blog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {

  // holds a copy of the post that is currently being edited
  post: Post;

  // make BlogService available through dependency injection
  constructor(private route: ActivatedRoute, private router: Router, private blogService: BlogService) { }

  // gets the post thats currently being edited
  async getEditPost(): Promise<void>
  {
    try
    {
      // use the BlogService to obtain the post to display
      let storedPost: Post = this.blogService.getCurrentDraft();

      // retrieve the postid of the post from the URL
      let urlPostid: number = +this.route.snapshot.paramMap.get('id');

      // if storedPost is null or if it has a different postid than the one in the URL
      if (storedPost == null || storedPost.postid != urlPostid)
      {
        // obtain the post from the Express server using the BlogService
        this.post = await this.blogService.getPost(this.blogService.getUsername(), urlPostid);
      }
      else // the postids match
      {
        this.post = storedPost;
      }

      // set the currentDraft to be this.post
      this.blogService.setCurrentDraft(this.post);
    }
    catch (err)
    {
      console.log(err);
    }
  }
  
  // saves the post to the server
  async savePost(): Promise<void>
  {
    try
    {
      this.post.modified = new Date();

      // if the post hasn't been saved yet
      if (this.blogService.isUnsaved())
      {
        // add it to the database
        await this.blogService.newPost(this.blogService.getUsername(), this.post);
      }
      else
      {
        // update it in the database
        await this.blogService.updatePost(this.blogService.getUsername(), this.post);
      }

      // indicate that the post has been saved
      this.blogService.setUnsaved(false);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // deletes the post from the server
  async deletePost(): Promise<void>
  {
    try
    {
      // only delete the post if it's been saved
      if (!this.blogService.isUnsaved())
      {
        await this.blogService.deletePost(this.blogService.getUsername(), this.post.postid);
      }

      // redirect to the list page
      this.router.navigate(['/']);
    }
    catch (err)
    {
      console.log(err);
    }
  }

  // previews the post with the markdown compiled into HTML
  previewPost(): void
  {
    // redirect to the preview page
    this.router.navigate(['/', 'preview', this.post.postid]);
  }

  // returns true if we should display the modification time
  displayModificationTime(): boolean
  {
    return !this.blogService.isUnsaved();
  }

  ngOnInit(): void
  {
    this.route.paramMap.subscribe(() => {
      this.getEditPost();
    });
  }

}
